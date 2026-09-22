const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// Patches Pods/fmt/include/fmt/base.h after pod install.
// Xcode 26+ clang enforces consteval strictly; changing FMT_USE_CONSTEVAL from 1 to 0
// disables the consteval path that triggers the build failure.
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

// Forces REACT_NATIVE_MINOR_VERSION=79 in RNReanimated's GCC_PREPROCESSOR_DEFINITIONS.
// The podspec sets this via s.xcconfig["OTHER_CFLAGS"] which is not reliably propagated
// to the pod's own compilation on Xcode 26. Direct build-settings mutation is authoritative.
const REANIMATED_FIX_RUBY = `
    # @generated begin expo-reanimated-minor-version-fix
    installer.pods_project.targets.each do |target|
      if target.name == 'RNReanimated'
        target.build_configurations.each do |config|
          defs = config.build_settings['GCC_PREPROCESSOR_DEFINITIONS']
          defs = ['$(inherited)'] if defs.nil?
          defs = [defs] if defs.is_a?(String)
          unless defs.any? { |d| d.include?('REACT_NATIVE_MINOR_VERSION') }
            defs << 'REACT_NATIVE_MINOR_VERSION=79'
            puts "expo-reanimated-minor-version-fix: set REACT_NATIVE_MINOR_VERSION=79 for #{config.name}"
          end
          config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] = defs
        end
      end
    end
    # @generated end expo-reanimated-minor-version-fix
`;

module.exports = function withFmtFix(config) {
  return withDangerousMod(config, [
    'ios',
    async (cfg) => {
      const podfilePath = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(podfilePath, 'utf8');

      const hasFmtFix = contents.includes('expo-fmt-use-consteval-fix');
      const hasReanimatedFix = contents.includes('expo-reanimated-minor-version-fix');

      if (hasFmtFix && hasReanimatedFix) {
        process.stderr.write('withFmtFix: both patches already present, skipping\n');
        return cfg;
      }

      const toInject = (!hasFmtFix ? FMT_FIX_RUBY : '') + (!hasReanimatedFix ? REANIMATED_FIX_RUBY : '');

      const start = contents.indexOf('react_native_post_install');

      if (start === -1) {
        process.stderr.write('withFmtFix: react_native_post_install not found, appending new post_install block\n');
        contents += `\npost_install do |installer|\n${toInject}\nend\n`;
        fs.writeFileSync(podfilePath, contents);
        return cfg;
      }

      const openParen = contents.indexOf('(', start);
      if (openParen === -1) {
        process.stderr.write('withFmtFix: ERROR — no opening paren after react_native_post_install\n');
        return cfg;
      }

      let depth = 0;
      let closingParen = -1;
      for (let i = openParen; i < contents.length; i++) {
        if (contents[i] === '(') depth++;
        else if (contents[i] === ')') {
          depth--;
          if (depth === 0) { closingParen = i; break; }
        }
      }

      if (closingParen === -1) {
        process.stderr.write('withFmtFix: ERROR — could not find closing paren of react_native_post_install\n');
        return cfg;
      }

      let endOfLine = contents.indexOf('\n', closingParen);
      if (endOfLine === -1) endOfLine = contents.length - 1;

      const before = contents.slice(0, endOfLine + 1);
      const after = contents.slice(endOfLine + 1);
      contents = before + toInject + after;

      fs.writeFileSync(podfilePath, contents);
      process.stderr.write(`withFmtFix: injected patches after react_native_post_install (char ${closingParen})\n`);
      return cfg;
    },
  ]);
};
