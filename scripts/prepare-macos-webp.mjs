import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  chmodSync,
  copyFileSync,
  mkdtempSync,
  readFileSync,
  rmSync
} from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

// Build from pinned sources: official prebuilt ARM binaries require macOS 15.
if (process.platform === 'darwin') {
  const { default: binary } = await import('cwebp-bin')
  const architectures = execFileSync('/usr/bin/lipo', ['-archs', binary], {
    encoding: 'utf8'
  })
  if (!architectures.includes('arm64') || !architectures.includes('x86_64')) {
    const temporary = mkdtempSync(path.join(tmpdir(), 'image-optimizer-webp-'))
    const run = (command, args, options = {}) =>
      execFileSync(command, args, {
        cwd: temporary,
        stdio: 'pipe',
        ...options
      })
    try {
      console.log('Building universal macOS WebP compressor…')
      const sources = [
        [
          'webp',
          'https://storage.googleapis.com/downloads.webmproject.org/releases/webp/libwebp-1.6.0.tar.gz',
          'e4ab7009bf0629fd11982d4c2aa83964cf244cffba7347ecd39019a9e38c4564'
        ],
        [
          'png',
          'https://codeload.github.com/pnggroup/libpng/tar.gz/refs/tags/v1.6.59',
          '2540302a1844ad2b2b501977abecfa850f265f97b78f065a712ab4074a89f5b5'
        ]
      ]
      for (const [name, url, checksum] of sources) {
        const archive = path.join(temporary, `${name}.tar.gz`)
        run('/usr/bin/curl', [
          '--fail',
          '--location',
          '--silent',
          '--show-error',
          '--retry',
          '3',
          '--max-time',
          '120',
          url,
          '-o',
          archive
        ])
        if (
          createHash('sha256').update(readFileSync(archive)).digest('hex') !==
          checksum
        ) {
          throw new Error(`Checksum mismatch for ${name}`)
        }
        run('/usr/bin/tar', ['-xzf', archive])
      }
      const { default: jpeg } = await import('mozjpeg')
      run('/usr/bin/tar', [
        '-xzf',
        path.join(path.dirname(jpeg), 'source/mozjpeg.tar.gz')
      ])
      const prefix = path.join(temporary, 'deps')
      const jpegOptions = {
        cwd: path.join(temporary, 'mozjpeg'),
        env: {
          ...process.env,
          CC: '/usr/bin/clang',
          CFLAGS: '-O3 -arch arm64 -arch x86_64',
          LDFLAGS: '-arch arm64 -arch x86_64',
          MACOSX_DEPLOYMENT_TARGET: '11.0',
          PKG_CONFIG: '/usr/bin/false',
          libpng_CFLAGS: '',
          libpng_LIBS: ''
        }
      }
      run(
        './configure',
        [
          '--disable-shared',
          '--enable-static',
          '--without-simd',
          `--prefix=${prefix}`
        ],
        jpegOptions
      )
      run(
        '/usr/bin/make',
        [
          '-j4',
          'install-libLTLIBRARIES',
          'install-includeHEADERS',
          'install-nodist_includeHEADERS'
        ],
        jpegOptions
      )
      const common = [
        '-DCMAKE_BUILD_TYPE=Release',
        '-DCMAKE_OSX_ARCHITECTURES=arm64;x86_64',
        '-DCMAKE_OSX_DEPLOYMENT_TARGET=11.0',
        '-DCMAKE_IGNORE_PREFIX_PATH=/opt/homebrew;/usr/local',
        '-DBUILD_SHARED_LIBS=OFF'
      ]
      run('cmake', [
        '-S',
        'libpng-1.6.59',
        '-B',
        'png-build',
        ...common,
        `-DCMAKE_INSTALL_PREFIX=${prefix}`,
        '-DPNG_SHARED=OFF',
        '-DPNG_TESTS=OFF',
        '-DPNG_TOOLS=OFF',
        '-DPNG_HARDWARE_OPTIMIZATIONS=OFF'
      ])
      run('cmake', ['--build', 'png-build', '--target', 'install', '-j4'])
      for (const arch of ['arm64', 'x86_64']) {
        run('cmake', [
          '-S',
          'libwebp-1.6.0',
          '-B',
          `webp-${arch}`,
          ...common,
          `-DCMAKE_OSX_ARCHITECTURES=${arch}`,
          `-DCMAKE_PREFIX_PATH=${prefix}`,
          `-DPNG_LIBRARY=${prefix}/lib/libpng16.a`,
          `-DPNG_PNG_INCLUDE_DIR=${prefix}/include`,
          `-DJPEG_LIBRARY=${prefix}/lib/libjpeg.a`,
          `-DJPEG_INCLUDE_DIR=${prefix}/include`,
          '-DWEBP_ENABLE_SIMD=ON',
          '-DWEBP_BUILD_ANIM_UTILS=OFF',
          '-DWEBP_BUILD_GIF2WEBP=OFF',
          '-DWEBP_BUILD_IMG2WEBP=OFF',
          '-DWEBP_BUILD_VWEBP=OFF',
          '-DWEBP_BUILD_EXTRAS=OFF',
          '-DCMAKE_DISABLE_FIND_PACKAGE_TIFF=ON',
          '-DCMAKE_DISABLE_FIND_PACKAGE_GIF=ON'
        ])
        run('cmake', ['--build', `webp-${arch}`, '--target', 'cwebp', '-j4'])
      }
      const compiled = path.join(temporary, 'cwebp')
      run('/usr/bin/lipo', [
        '-create',
        'webp-arm64/cwebp',
        'webp-x86_64/cwebp',
        '-output',
        compiled
      ])
      for (const arch of ['arm64', 'x86_64'])
        run('/usr/bin/lipo', [compiled, '-verify_arch', arch])
      run(compiled, ['-version'])
      const linkage = run('/usr/bin/otool', ['-L', compiled]).toString()
      if (
        linkage.includes('/opt/') ||
        linkage.includes('/usr/local/') ||
        linkage.includes('@rpath')
      )
        throw new Error('WebP has non-system dynamic dependencies')
      copyFileSync(compiled, binary)
      chmodSync(binary, 0o755)
      // Keep the linked libraries' notices alongside the packaged executable.
      for (const [source, name] of [
        ['libwebp-1.6.0/COPYING', 'COPYING.webp'],
        ['libwebp-1.6.0/PATENTS', 'PATENTS.webp'],
        ['libpng-1.6.59/LICENSE', 'LICENSE.png'],
        ['mozjpeg/README.ijg', 'README.jpeg']
      ]) {
        copyFileSync(
          path.join(temporary, source),
          path.join(path.dirname(binary), name)
        )
      }
    } catch (error) {
      if (error.stderr) console.error(error.stderr.toString())
      if (error.stdout) console.error(error.stdout.toString())
      throw error
    } finally {
      rmSync(temporary, { recursive: true, force: true })
    }
  }
}
