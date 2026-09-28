import { Platform } from "react-native";

import { nativeStorage } from "./nativeStorage";
import { webStorage } from "./webStorage";

export const StorageService =
  Platform.OS === "web" ? webStorage : nativeStorage;
