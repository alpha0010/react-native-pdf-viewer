require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "react-native-pdf-light"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => min_ios_version_supported }
  s.source       = { :git => "https://github.com/alpha0010/react-native-pdf-viewer.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm,swift,cpp}"
  s.public_header_files = "ios/PdfView-Bridging-Header.h"

  s.subspec "cpp" do |ss|
    ss.source_files         = "cpp/**/*.{cpp,h}"
    ss.header_mappings_dir  = "cpp"
    ss.private_header_files = "cpp/**/*.h"
  end

  install_modules_dependencies(s)
end
