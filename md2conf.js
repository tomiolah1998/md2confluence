const fs = require('fs');

function usage() {
  console.log(`\n\nUsage:\n\t${process.argv[1]} <markdown_file> [-o <output_filename_or_path>]\n\n`);
}

function readFile(path) {
  let buff = fs.readFileSync(path);
  return buff.toString();
}









// Tranform Heading line to Confluence heading
function headings(input, callback) {
  let line = input;
  if (/^#{1,}[a-zA-Z_ `-]+$/.test(line)) {
    // Count the number of #
    let heading = 0;
    line.split('').forEach(character => {
      if (character === '#') heading++;
    });
    return (callback) ? callback(`h${heading}.${line.replace(/#{1,}/,'')}`) : `h${heading}.${line.replace(/#{1,}/,'')}`;
  } else return (callback) ? callback(input) : input;
}

// Transform `...` to {{...}}
function inline_monospace(input, callback) {
  let line = input;
  if (/`(.*)`/g.test(line)) {
    let temp = line.replace(/`([a-zA-Z><\.=0-9\/\ _*-@]+)`/g, /{{$1}}/).replace(/\/\{/g,'{').replace(/\}\/[g]?/g,'}');
    return (callback) ? callback(temp) : temp;
  } else return (callback) ? callback(input) : input;
}

// Trasform *abc* to _abc_
function italic(input, callback) {
  let line = input.replace(/\s\*([^\r\n\t\f\v \*]+)\*\s/gm, ' _$1_ ');
  return (callback) ? callback(line) : line;
}

// Transform **abc** to *abc*
function bold(input, callback) {
  let line = input.replace(/[\*]{2}([^\r\n\t\f\v \*]+)[\*]{2}/gm,'*$1*');
  return (callback) ? callback(line) : line;
}

// Transform code-blocks
function code_block(input, callback) {
  let line  = input;
  line = line.replace(/^[\`]{3}([a-zA-Z0-9]+)$/g, '{code:linenumbers=true|language=$1}');
  line = line.replace(/^([\s]*)```$/g,'$1{code}');
  return (callback) ? callback(line) : line;
}

// Transform hyperlinks
function hyperlinks(input, callback) {
  let line = input;
  line = line.replace(/\[(\S+)\]\((\S+)\)/, '[$1|$2]');
  line = line.replace(/\s+(http[s]?:\/\/[a-zA-Z\.0-9_?\/=-]+)(\s+|$)/gm,' [$1] ');
  return (callback) ? callback(line) : line;
}








// Tranform MD syntax to Confluence
function transform(input) {
  let output = '';
  input.forEach(line => {
    let result = line;

    result = headings(result,
      re1 => inline_monospace(re1,
        re2 => italic(re2,
            re3 => bold(re3,
              re4 => code_block(re4,
                re5 => hyperlinks(re5)
    )))));

    if (output !== '') output += '\n';
    output += result;
  });
  return output;
}

function writeFile(path, content) {
  fs.writeFileSync(path, content);
}

function main(args) {
  if (args.length < 2 || args.length > 4) {
    console.error('Invalid number of arguments!');
    usage();
    process.exit(1);
  }

  const input = args[1];
  let output = './output.confluence';

  if (args[2] === '-o') {
    output = args[3];
  }

  const input_text = readFile(input);

  let result = transform(input_text.split('\n'));
  writeFile(output, result);
}

let argv = process.argv;
argv.splice(0, 1);

main(argv);