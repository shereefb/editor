import store from '../store'

let codeMirror = null

export function setupCodeMirrorRefs (cmRef) {
  codeMirror = cmRef
}

export function highlightSelectedFeatureInCodeArea (feature, geojson) {
  const substring = JSON.stringify(feature, null, 2)
  const l = lineOf(geojson, substring)
  console.log(l);
  codeMirror.codemirror.scrollIntoView({
    line: l, char:0
  }, 200)
  codeMirror.codemirror.setCursor({
    line: l, char: 0
  })
  codeMirror.codemirror.setSelection({
    line: l, char: 0
  })
  // codeMirror.codemirror.replaceRange(
  //   "properties: {'name':''}",{line: l+1},{line: l+1}
  // )

}

function lineOf(text, substring) {
  var textnospace = text.replace(/[^\S\r\n]/g, "");
  var substringnospace = substring.replace(/[^\S\r\n]/g, "");
  var index = textnospace.indexOf(substringnospace);
  var tempString = textnospace.substring(0, index);
  return tempString.split('\n').length;
}
