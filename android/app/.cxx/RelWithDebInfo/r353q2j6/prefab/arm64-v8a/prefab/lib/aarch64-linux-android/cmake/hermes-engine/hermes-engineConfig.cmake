if(NOT TARGET hermes-engine::libhermes)
add_library(hermes-engine::libhermes SHARED IMPORTED)
set_target_properties(hermes-engine::libhermes PROPERTIES
    IMPORTED_LOCATION "C:/Users/Muhammed Anazil T A/.gradle/caches/8.14.3/transforms/b611cabdcb891b9b2b06cb85714ef87f/transformed/hermes-android-0.81.5-release/prefab/modules/libhermes/libs/android.arm64-v8a/libhermes.so"
    INTERFACE_INCLUDE_DIRECTORIES "C:/Users/Muhammed Anazil T A/.gradle/caches/8.14.3/transforms/b611cabdcb891b9b2b06cb85714ef87f/transformed/hermes-android-0.81.5-release/prefab/modules/libhermes/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

