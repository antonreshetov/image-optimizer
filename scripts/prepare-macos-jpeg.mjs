import { execFileSync } from 'node:child_process'
import { copyFileSync, mkdtempSync, rmSync, chmodSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

// The npm package ships an Intel-only executable. Build its bundled source
// for both Mac architectures so development and packaged apps need no Rosetta.
if (process.platform === 'darwin') {
  const { default: binary } = await import('mozjpeg')
  const architectures = execFileSync('/usr/bin/lipo', ['-archs', binary], {
    encoding: 'utf8'
  })
  if (!architectures.includes('arm64') || !architectures.includes('x86_64')) {
    const temporary = mkdtempSync(path.join(tmpdir(), 'image-optimizer-jpeg-'))
    try {
      console.log('Building universal macOS JPEG compressor…')
      execFileSync('/usr/bin/tar', [
        '-xzf',
        path.join(path.dirname(binary), 'source/mozjpeg.tar.gz'),
        '-C',
        temporary
      ])
      const options = {
        cwd: path.join(temporary, 'mozjpeg'),
        env: {
          ...process.env,
          CC: '/usr/bin/clang',
          CFLAGS: '-O3 -arch arm64 -arch x86_64',
          LDFLAGS: '-arch arm64 -arch x86_64',
          MACOSX_DEPLOYMENT_TARGET: '11.0',
          // JPEG input needs no libpng; avoid linking against local Homebrew libs.
          PKG_CONFIG: '/usr/bin/false',
          libpng_CFLAGS: '',
          libpng_LIBS: ''
        },
        stdio: 'pipe'
      }
      execFileSync(
        './configure',
        ['--disable-shared', '--enable-static', '--without-simd'],
        options
      )
      execFileSync('/usr/bin/make', ['-j4', 'cjpeg'], options)
      const compiled = path.join(options.cwd, 'cjpeg')
      for (const arch of ['arm64', 'x86_64']) {
        execFileSync('/usr/bin/lipo', [compiled, '-verify_arch', arch])
      }
      execFileSync(compiled, ['-version'])
      copyFileSync(compiled, binary)
      chmodSync(binary, 0o755)
    } finally {
      rmSync(temporary, { recursive: true, force: true })
    }
  }
}
