// xml-lint.js
// Usable as an importable module or directly executable CLI script.

'use strict';

const fs = require('fs');
const xmldom = require('@xmldom/xmldom');
const xpath = require('xpath');

const BLOGGER_NS = 'http://www.google.com/2005/gml/b';
const bSelect = xpath.useNamespaces({ b: BLOGGER_NS });
const BLOGGER_EXPR_RE = /\bdata:[a-zA-Z]|<b:|expr:/;

function parseXML(xmlString) {
    const errors = [];
    const warnings = [];
    const src = xmlString.charCodeAt(0) === 0xFEFF ? xmlString.slice(1) : xmlString;
    const parser = new xmldom.DOMParser({
        onError: (level, msg) => {
            if (level === 'warning') warnings.push(msg);
            else errors.push(msg);
        },
    });
    let doc = null;
    try { doc = parser.parseFromString(src, 'text/xml'); }
    catch (e) { errors.push(e.message || String(e)); }
    return { doc, errors, warnings };
}

function findDuplicateMetaNames(metaTags) {
    const seen = {};
    const duplicates = [];
    for (const tag of metaTags) {
        const name = tag.getAttribute('name');
        if (!name || BLOGGER_EXPR_RE.test(name)) continue;
        if (seen[name]) { if (!duplicates.includes(name)) duplicates.push(name); }
        else seen[name] = true;
    }
    return duplicates;
}

function findIfsMissingCond(ifTags) {
    return ifTags.filter((tag) => {
        const cond = tag.getAttribute('cond');
        return !cond || cond.trim() === '';
    });
}

function findDuplicateIds(elements) {
    const seen = {};
    const duplicates = [];
    for (const el of elements) {
        const id = el.getAttribute('id');
        if (!id || BLOGGER_EXPR_RE.test(id)) continue;
        if (seen[id]) { if (!duplicates.includes(id)) duplicates.push(id); }
        else seen[id] = true;
    }
    return duplicates;
}

function decodeXmlEntities(str) {
    return str.replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}

function hasChildElements(el) {
    for (let i = 0; i < el.childNodes.length; i++) {
        if (el.childNodes[i].nodeType === 1) return true;
    }
    return false;
}

const BLOGGER_TEXT_RE = /<data:|<b:|expr:/;

function validateJsonLd(scripts) {
    const errors = [];
    const warnings = [];
    scripts.forEach((script, idx) => {
        const rawSrc = (script.textContent || '').trim();
        if (!rawSrc) return;
        if (hasChildElements(script) || BLOGGER_TEXT_RE.test(rawSrc)) {
            warnings.push(`JSON-LD block #${idx + 1} contains Blogger template expressions — skipped (not parseable as static JSON)`);
            return;
        }
        const src = decodeXmlEntities(rawSrc);
        try { JSON.parse(src); }
        catch (e) { errors.push(`JSON-LD block #${idx + 1} is invalid JSON: ${e.message}`); }
    });
    return { errors, warnings };
}

function lintXML(xmlString) {
    const errors = [];
    const warnings = [];
    const { doc, errors: parseErrors, warnings: parseWarnings } = parseXML(xmlString);
    if (parseErrors.length) errors.push(...parseErrors.map((e) => `XML parse error: ${e}`));
    if (parseWarnings.length) warnings.push(...parseWarnings.map((w) => `XML parse warning: ${w}`));
    if (!doc) {
        errors.push('XML document could not be parsed.');
        return { errors, warnings };
    }
    const rootNS = doc.documentElement && doc.documentElement.getAttribute('xmlns:b');
    if (rootNS !== BLOGGER_NS) errors.push(`Missing or incorrect Blogger namespace. Expected xmlns:b="${BLOGGER_NS}", found: ${rootNS || '(none)'}`);
    const ifTags = bSelect('//b:if', doc);
    const missingCond = findIfsMissingCond(ifTags);
    if (missingCond.length) errors.push(`${missingCond.length} <b:if> element(s) are missing the required "cond" attribute.`);
    const dupIds = findDuplicateIds(xpath.select('//*[@id]', doc));
    if (dupIds.length) warnings.push(`Duplicate static HTML id(s) detected: ${dupIds.join(', ')}`);
    const dupMeta = findDuplicateMetaNames(xpath.select("//*[local-name()='meta']", doc));
    if (dupMeta.length) warnings.push(`Duplicate meta name(s) detected: ${dupMeta.join(', ')}`);
    const jsonLdResult = validateJsonLd(xpath.select("//*[local-name()='script'][@type='application/ld+json']", doc));
    errors.push(...jsonLdResult.errors);
    warnings.push(...jsonLdResult.warnings);
    return { errors, warnings };
}

function main() {
    const filePath = process.argv[2] || 'asset/xml/thebukitbesi.xml';
    if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${filePath}`);
        process.exit(1);
    }
    let xmlString;
    try { xmlString = fs.readFileSync(filePath, 'utf8'); }
    catch (err) {
        console.error(`❌ Cannot read file: ${filePath}\n${err.message}`);
        process.exit(1);
    }
    console.log(`\nValidating: ${filePath}`);
    console.log('─'.repeat(60));
    const { errors, warnings } = lintXML(xmlString);
    if (warnings.length) {
        console.log(`\nWarnings (${warnings.length}):`);
        warnings.forEach((w) => console.log(`  ⚠  ${w}`));
    }
    if (errors.length) {
        console.log(`\nErrors (${errors.length}):`);
        errors.forEach((e) => console.log(`  ✖  ${e}`));
        console.log('\n✖ Validation FAILED\n');
        process.exit(1);
    }
    console.log(warnings.length ? '' : '\n');
    console.log(`✔ Validation PASSED${warnings.length ? ` (${warnings.length} warning(s))` : ''}\n`);
    process.exit(0);
}

module.exports = { lintXML, parseXML };
if (require.main === module) main();
