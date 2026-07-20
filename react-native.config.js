const path = require('path');

module.exports = {
  dependencies: {
    platforms: {
      android: {
        componentDescriptors: ['PdfViewComponentDescriptor'],
        cmakeListsPath: path.join(__dirname, 'android/CMakeLists.txt'),
      },
    },
  },
};
