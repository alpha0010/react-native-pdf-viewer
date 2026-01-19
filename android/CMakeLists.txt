cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

file(GLOB common_SRCS CONFIGURE_DEPENDS ../cpp/*.cpp)
file(GLOB react_codegen_SRCS CONFIGURE_DEPENDS
  build/generated/source/codegen/jni/*.cpp
  build/generated/source/codegen/jni/react/renderer/components/PdfViewSpec/*.cpp
)

add_library(
  react_codegen_PdfViewSpec
  OBJECT
  ${common_SRCS}
  ${react_codegen_SRCS}
)

target_include_directories(react_codegen_PdfViewSpec PUBLIC ../cpp build/generated/source/codegen/jni)

target_link_libraries(
  react_codegen_PdfViewSpec
  fbjni
  jsi
  reactnative
)

target_compile_reactnative_options(react_codegen_PdfViewSpec PRIVATE)
