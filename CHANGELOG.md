## [1.5.2](https://github.com/alpha0010/react-native-pdf-viewer/compare/v1.5.1...v1.5.2) (2021-02-18)


### Features

* support measuring native view ([565f9c9](https://github.com/alpha0010/react-native-pdf-viewer/commit/565f9c9b1b75d89cc649ba1d7b0f729528f447e1))

## [1.5.1](https://github.com/alpha0010/react-native-pdf-viewer/compare/v1.5.0...v1.5.1) (2021-01-27)


### Bug Fixes

* **android:** avoid package namespace collision ([bc38258](https://github.com/alpha0010/react-native-pdf-viewer/commit/bc38258b70a132e884c82f6cd7aad860cda85b61))

# [1.5.0](https://github.com/alpha0010/react-native-pdf-viewer/compare/v1.4.0...v1.5.0) (2021-01-06)


### Features

* support shrink pages to fit in document viewer ([f1fa4ef](https://github.com/alpha0010/react-native-pdf-viewer/commit/f1fa4efe658c52e336734b022fb242da94ec89b0))

# [1.4.0](https://github.com/alpha0010/react-native-pdf-viewer/compare/v1.3.3...v1.4.0) (2020-12-10)


### Features

* expose FlatList refresh control ([aa6c0f8](https://github.com/alpha0010/react-native-pdf-viewer/commit/aa6c0f85dc01c2de5c75bccb4077bce0f6c2ab8a))

## [1.3.3](https://github.com/alpha0010/react-native-pdf-viewer/compare/v1.3.2...v1.3.3) (2020-12-04)


### Bug Fixes

* **android:** position pages at default aspect ratio for API < 26 ([3aa2c45](https://github.com/alpha0010/react-native-pdf-viewer/commit/3aa2c4537838f0f9554cb02bcbe70cd946bca059))

## [1.3.2](https://github.com/alpha0010/react-native-pdf-viewer/compare/v1.3.1...v1.3.2) (2020-10-25)


### Bug Fixes

* **android:** native PdfRenderer is not thread safe ([4dfe574](https://github.com/alpha0010/react-native-pdf-viewer/commit/4dfe5746fb096786fd6e5f4a42191c32559820d8))

## [1.3.1](https://github.com/alpha0010/react-native-pdf-viewer/compare/v1.3.0...v1.3.1) (2020-10-13)


### Bug Fixes

* **types:** support testID on views ([8d8216b](https://github.com/alpha0010/react-native-pdf-viewer/commit/8d8216bd6a27da2bf312e44c04c86b9c6a889b46))

# [1.3.0](https://github.com/alpha0010/react-native-pdf-viewer/compare/v1.2.0...v1.3.0) (2020-10-12)


### Features

* support page resize mode ([0e96e3c](https://github.com/alpha0010/react-native-pdf-viewer/commit/0e96e3cb35d685c7cb9e310099d7c9c1dd4d6420))

# [1.2.0](https://github.com/alpha0010/react-native-pdf-viewer/compare/v1.1.0...v1.2.0) (2020-10-02)


### Features

* dispatch error/completion events from native renderer ([865e93c](https://github.com/alpha0010/react-native-pdf-viewer/commit/865e93cb9b892198f52ebd231ab8f04a6701255e))
* expose rendered page measurement details ([46be2c2](https://github.com/alpha0010/react-native-pdf-viewer/commit/46be2c253b96c4485a808c5a15885ad492b4b621))
* expose some props of the underlying FlatList ([3fe0fa1](https://github.com/alpha0010/react-native-pdf-viewer/commit/3fe0fa112d84b9364582c4257e6981344ba6d155))
* support scroll to offset ([0fbe2bf](https://github.com/alpha0010/react-native-pdf-viewer/commit/0fbe2bf8e08f10b4976d4b6728805d082c4e1d0b))

# [1.1.0](https://github.com/alpha0010/react-native-pdf-viewer/compare/v1.0.0...v1.1.0) (2020-09-28)


### Bug Fixes

* doubled separator measure for flatlist layout computation ([f6694ab](https://github.com/alpha0010/react-native-pdf-viewer/commit/f6694abde3cefbc332e16512a59ac5a6aa56013e))
* wait for view measure before rendering pages ([a64b53f](https://github.com/alpha0010/react-native-pdf-viewer/commit/a64b53f55854a8a2c98dda215aec32e68f5b65b3))


### Features

* support imperative scroll access ([889943d](https://github.com/alpha0010/react-native-pdf-viewer/commit/889943dabd798665a2bf5b2d535bbc253bd19af9))

# [1.0.0](https://github.com/alpha0010/react-native-pdf-viewer/compare/v0.4.0...v1.0.0) (2020-09-24)


### Features

* **android:** cache page measurements for layout ([f24e491](https://github.com/alpha0010/react-native-pdf-viewer/commit/f24e491ff6d9848b8b096162bef2a7ea2d8c3cbb))
* measure all pages AOT, assists smooth scrolling ([2d7d1a8](https://github.com/alpha0010/react-native-pdf-viewer/commit/2d7d1a8545dba65a210ff3ff416135ba7d0c2f30))

# [0.4.0](https://github.com/alpha0010/react-native-pdf-viewer/compare/v0.3.0...v0.4.0) (2020-09-23)


### Bug Fixes

* **ios:** actually correctly display rotated pages ([7a1ca6d](https://github.com/alpha0010/react-native-pdf-viewer/commit/7a1ca6de5661ee4f678c84aa6bef60f1086bb78d))
* **ios:** correct display orientation of rotated pages ([223944f](https://github.com/alpha0010/react-native-pdf-viewer/commit/223944fff7a8583985175b21e29fbab02ef0c1f2))


### Features

* **android:** render pages in background ([c53f875](https://github.com/alpha0010/react-native-pdf-viewer/commit/c53f875ddbed5bcb1cf92356e5dfc6d3f4591609))
* **ios:** render pages in background ([fcfeb08](https://github.com/alpha0010/react-native-pdf-viewer/commit/fcfeb0862687eb52fce2f35242022843ce974c7f))
* reduce render memory requirements ([82bac5a](https://github.com/alpha0010/react-native-pdf-viewer/commit/82bac5a9c7ef3e3567cc71a2a8e88d0fcfafd89e))

# [0.3.0](https://github.com/alpha0010/react-native-pdf-viewer/compare/v0.2.0...v0.3.0) (2020-09-21)


### Bug Fixes

* reduce unnecessary alpha compositing ([1c35b53](https://github.com/alpha0010/react-native-pdf-viewer/commit/1c35b539b1f4556bc97806ed2fcb9decf8e197c3))


### Features

* support load/error callbacks ([2bc285f](https://github.com/alpha0010/react-native-pdf-viewer/commit/2bc285fad3abc6e1d2781f5ae5d80af040405807))



# [0.2.0](https://github.com/alpha0010/react-native-pdf-viewer/compare/v0.2.0...v0.3.0) (2020-09-20)


### Bug Fixes

* **ios:** match render window size for small pages ([c0fa34e](https://github.com/alpha0010/react-native-pdf-viewer/commit/c0fa34ebd18fb7764954c6249277b1b2320537d8))


### Features

* **android:** draft pdf renderer ([118ca96](https://github.com/alpha0010/react-native-pdf-viewer/commit/118ca9689c0c2ad1dd5019cc11a916cffb4b9dc6))
* **ios:** add pdf utility functions ([d420f18](https://github.com/alpha0010/react-native-pdf-viewer/commit/d420f1801958cc9ac5bea253b86010f46ad3ef47))
* **ios:** draft pdf renderer ([b544264](https://github.com/alpha0010/react-native-pdf-viewer/commit/b5442648b5df307b6eaa11a7e6f67c5e57ba4e59))
* **ios:** measure page size for layout ([9b4ed14](https://github.com/alpha0010/react-native-pdf-viewer/commit/9b4ed14fc72c00ba9d0d34e501c4b653138bb7ac))
* draft viewer ([6ed64a1](https://github.com/alpha0010/react-native-pdf-viewer/commit/6ed64a1ad278123ba3bdc5560942cc2e4ab4f4e1))

