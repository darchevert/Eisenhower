const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// Patches Pods/fmt/include/fmt/base.h after pod install.
// Xcode 26+ clang enforces consteval strictly; changing FMT_USE_CONSTEVAL from 1 to 0
// disables the consteval path that triggers the build failure.
// Approach taken from expo/expo PR #44230 (closed contributor PR, not yet in build-properties).
const FMT_FIX_RUBY = `
    # @generated begin expo-fmt-use-consteval-fix
    fmt_base = File.join(installer.sandbox.root.to_s, 'fmt', 'include', 'fmt', 'base.h')
    if File.exist?(fmt_base)
      content = File.read(fmt_base)
      patched = content.gsub(/#\\s*define FMT_USE_CONSTEVAL 1/, '# define FMT_USE_CONSTEVAL 0')
      if patched != content
        File.chmod(0644, fmt_base)
        File.write(fmt_base, patched)
        puts "expo-fmt-use-consteval-fix: patched #{fmt_base}"
      else
        puts "expo-fmt-use-consteval-fix: #{fmt_base} already patched or pattern not found"
      end
    else
      puts "expo-fmt-use-consteval-fix: #{fmt_base} not found, skipping"
    end
    # @generated end expo-fmt-use-consteval-fix
`;

module.exports = function withFmtFix(config) {
  return withDangerousMod(config, [
    'ios',
    async (cfg) => {
      const podfilePath = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(podfilePath, 'utf8');

      if (contents.includes('expo-fmt-use-consteval-fix')) {
        process.stderr.write('withFmtFix: already patched, skipping\n');
        return cfg;
      }

      // Find react_native_post_install(...) and inject right after its closing paren line.
      // This avoids having to parse post_install block boundaries.
      const start = contents.indexOf('react_native_post_install');

      if (start === -1) {
        // No react_native_post_install — append a standalone post_install block
        process.stderr.write('withFmtFix: react_native_post_install not found, appending new post_install block\n');
        contents += `\npost_install do |installer|\n${FMT_FIX_RUBY}\nend\n`;
        fs.writeFileSync(podfilePath, contents);
        return cfg;
      }

      // Find opening paren
      const openParen = contents.indexOf('(', start);
      if (openParen === -1) {
        process.stderr.write('withFmtFix: ERROR — no opening paren after react_native_post_install\n');
        return cfg;
      }

      // Walk forward to find matching closing paren (handles multi-line call)
      let depth = 0;
      let closingParen = -1;
      for (let i = openParen; i < contents.length; i++) {
        if (contents[i] === '(') depth++;
        else if (contents[i] === ')') {
          depth--;
          if (depth === 0) {
            closingParen = i;
            break;
          }
        }
      }

      if (closingParen === -1) {
        process.stderr.write('withFmtFix: ERROR — could not find closing paren of react_native_post_install\n');
        return cfg;
      }

      // Insert after the end of the line containing the closing paren
      let endOfLine = contents.indexOf('\n', closingParen);
      if (endOfLine === -1) endOfLine = contents.length - 1;

      const before = contents.slice(0, endOfLine + 1);
      const after = contents.slice(endOfLine + 1);
      contents = before + FMT_FIX_RUBY + after;

      fs.writeFileSync(podfilePath, contents);
      process.stderr.write(`withFmtFix: injected fmt base.h patch after react_native_post_install (char ${closingParen})\n`);
      return cfg;
    },
  ]);
};
