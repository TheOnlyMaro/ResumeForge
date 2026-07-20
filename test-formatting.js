const isAlphanumeric = (char) => /[a-zA-Z0-9]/.test(char);

const isValidFormattingStart = (text, i, markerLength) => {
  if (i > 0 && text[i - 1] !== ' ') return false;
  const nextIdx = i + markerLength;
  if (nextIdx >= text.length || text[nextIdx] === ' ') return false;
  return true;
};

const isValidFormattingEnd = (text, i, markerLength) => {
  if (i === 0 || text[i - 1] === ' ') return false;
  const nextIdx = i + markerLength;
  if (nextIdx < text.length && text[nextIdx] !== ' ' && isAlphanumeric(text[nextIdx])) return false;
  return true;
};

const findMatchingParen = (text, openIndex) => {
  let depth = 0;
  for (let i = openIndex; i < text.length; i += 1) {
    if (text[i] === '(') depth += 1;
    else if (text[i] === ')') {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
};

const findLinkSeparator = (text) => {
  let depth = 0;
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] === '(') depth += 1;
    else if (text[i] === ')') depth = Math.max(0, depth - 1);
    else if (text[i] === ',' && depth === 0) return i;
  }
  return -1;
};

// Test cases
console.log('=== PROBLEMATIC CASE ===');
const testText = 'the module page_builder, there is a use for the function get_page where...';
console.log('Input: ' + testText);
console.log('Expected: Underscores in page_builder and get_page should NOT be formatting');
console.log('');

for (let i = 0; i < testText.length; i++) {
  if (testText[i] === '_') {
    const openValid = isValidFormattingStart(testText, i, 1);
    const closeValid = isValidFormattingEnd(testText, i, 1);
    const context = testText.substring(Math.max(0, i-3), i+4);
    console.log('  _ at position ' + i + ' (context: "' + context + '"): opening=' + openValid + ', closing=' + closeValid);
  }
}

console.log('\n=== INTENDED FORMATTING ===');
const testText2 = 'Use *bold text* and _italic text_ here.';
console.log('Input: ' + testText2);
console.log('Expected: * and _ should be recognized as formatting pairs');
console.log('');

for (let i = 0; i < testText2.length; i++) {
  if (testText2[i] === '*' || testText2[i] === '_') {
    const openValid = isValidFormattingStart(testText2, i, 1);
    const closeValid = isValidFormattingEnd(testText2, i, 1);
    const context = testText2.substring(Math.max(0, i-3), Math.min(testText2.length, i+4));
    console.log('  ' + testText2[i] + ' at position ' + i + ' (context: "' + context + '"): opening=' + openValid + ', closing=' + closeValid);
  }
}

console.log('\n=== MIXED CASE ===');
const testText3 = 'The _page_builder module is great. Use *bold* and _italic_ properly.';
console.log('Input: ' + testText3);
console.log('');

for (let i = 0; i < testText3.length; i++) {
  if (testText3[i] === '_' || testText3[i] === '*') {
    const openValid = isValidFormattingStart(testText3, i, 1);
    const closeValid = isValidFormattingEnd(testText3, i, 1);
    const context = testText3.substring(Math.max(0, i-3), Math.min(testText3.length, i+4));
    if (openValid || closeValid) {
      console.log('  ' + testText3[i] + ' at position ' + i + ' (context: "' + context + '"): opening=' + openValid + ', closing=' + closeValid);
    }
  }
}

console.log('\n=== INLINE LINK ===');
const testText4 = 'Read &link(OpenAI, https://openai.com) for more.';
console.log('Input: ' + testText4);
const linkStart = testText4.indexOf('&link(');
if (linkStart !== -1) {
  const openIndex = linkStart + 5;
  const closeIndex = findMatchingParen(testText4, openIndex);
  const linkBody = closeIndex !== -1 ? testText4.slice(openIndex + 1, closeIndex) : '';
  const separatorIndex = findLinkSeparator(linkBody);
  const displayText = separatorIndex !== -1 ? linkBody.slice(0, separatorIndex).trim() : '';
  const linkUrl = separatorIndex !== -1 ? linkBody.slice(separatorIndex + 1).trim() : '';
  console.log('Parsed display text: ' + displayText);
  console.log('Parsed link url: ' + linkUrl);
}
