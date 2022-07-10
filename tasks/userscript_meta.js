/* eslint-disable func-names */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable default-case */
/* eslint-disable no-prototype-builtins */
/* eslint-disable no-restricted-syntax */
/*
 * grunt-userscript-meta
 * https://github.com/Zod-/grunt-userscript-meta
 *
 * Copyright (c) 2015 Julian Hangstörfer
 * Licensed under the MIT license.
 */

module.exports = function (grunt) {
  grunt.registerMultiTask('userscript-meta', 'Generate the userscript metadata-block with package.json', function () {
    const opts = this.options({
      pkg: grunt.config.get('pkg'),
    });
    if (!opts.pkg) {
      grunt.config.requires('pkg');
    }
    const { pkg } = opts;
    const metaData = [];
    let src = '';
    let maxKeyLength = 0;
    pkg.userscript = pkg.userscript || {};

    function push(k, v) {
      /* if (!v) {
          return;
        } */
      if (Array.isArray(v)) {
        v.forEach((vv) => {
          push(k, vv);
        });
      } else {
        const obj = {};
        maxKeyLength = Math.max(maxKeyLength, k.length + 2);
        obj[k] = v;
        metaData.push(obj);
        grunt.verbose.writeln(`Adding ${k}: ${v}`);
      }
    }

    function localization(meta, v) {
      for (const name in v) {
        if (v.hasOwnProperty(name)) {
          push(`${meta}:${name}`, v[name]);
        }
      }
    }

    push('name', pkg.name);
    localization('name', pkg.userscript.name);

    push('version', pkg.version);

    push('namespace', pkg.userscript.namespace);

    push('description', pkg.description);
    localization('description', pkg.userscript.description);

    function author(meta, person) {
      if (Array.isArray(person)) {
        person.forEach((p) => {
          author(meta, p);
        });
      } else if (typeof person === 'string') {
        const name = person.match(/([^<]*)<[^>]*>[^(]*\([^)]*\)/)[1];
        push(meta, name.trim());
      } else if (typeof person === 'object') {
        push(meta, person.name);
      }
    }
    author('author', pkg.userscript.author || pkg.author);
    author('contributor', pkg.contributors);

    // push('homepageURL', pkg.homepage);

    /* function license(lic) {
        if (Array.isArray(lic)) {
          lic.forEach(license);
        } else if (typeof lic === 'string') {
          push('license', lic);
        } else if (typeof lic === 'object') {
          push('license', lic.type);
        }
      }
      license(pkg.license);
      license(pkg.licenses); */

    function resource(res) {
      if (Array.isArray(res)) {
        res.forEach(resource);
      } else if (typeof res === 'object') {
        push('resource', `${res.name} ${res.url}`);
      }
    }
    resource(pkg.userscript.resource);

    function greasyfork(req) {
      if (Array.isArray(req)) {
        req.forEach(greasyfork);
        return;
      }
      if (typeof req !== 'object') {
        return;
      }
      let url = 'https://greasyfork.org/scripts/';
      url += req.id;
      url += '/code/code.js';
      if (req.version) {
        url += `?version=${req.version}`;
      }
      push('require', url);
    }

    function require(req) {
      if (typeof req !== 'object') {
        return;
      }
      for (const provider in req) {
        if (req.hasOwnProperty(provider)) {
          switch (provider) {
            case 'greasyfork':
              greasyfork(req[provider]);
              break;
          }
        }
      }
    }
    require(pkg.userscript.require);

    for (const other in pkg.userscript.other) {
      if (pkg.userscript.other.hasOwnProperty(other)) {
        push(other, pkg.userscript.other[other]);
      }
    }

    function repeat(str, n) {
      let ret = '';
      for (let i = 0; i < n; i += 1) {
        ret += str;
      }
      return ret;
    }

    src += '// ==UserScript==\n';
    metaData.forEach((meta) => {
      for (const metaKey in meta) {
        if (meta.hasOwnProperty(metaKey)) {
          src += `// @${`${metaKey + repeat(' ', maxKeyLength - metaKey.length)}  ${meta[metaKey]}`.trim()}\n`;
        }
      }
    });
    src += '// ==/UserScript==\n';

    this.files.forEach((f) => {
      grunt.file.write(f.dest, src);
    });
  });
};
