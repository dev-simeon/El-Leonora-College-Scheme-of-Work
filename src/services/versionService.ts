import { Platform } from 'react-native';
import api, { API_BASE_URL } from './api';
import { AppApi, GetLatestVersionPlatformEnum, GetLatestVersionAppTypeEnum } from '../api/generated/endpoints/app-api';
import { Configuration } from '../api/generated/configuration';
import { AppVersionResponseDto } from '../api/generated/models';
import { getApiErrorMessage } from '../utils/apiError';

const appApi = new AppApi(
  new Configuration({ basePath: API_BASE_URL }),
  API_BASE_URL,
  api
);

/**
 * Fetches the latest version information from the server for the current platform.
 */
export const getLatestVersion = async (): Promise<AppVersionResponseDto> => {
  try {
    const platform = Platform.OS === 'ios' 
      ? GetLatestVersionPlatformEnum.IOS 
      : GetLatestVersionPlatformEnum.Android;

    const response = await appApi.getLatestVersion({
      appType: GetLatestVersionAppTypeEnum.Mobile,
      platform: platform,
    });

    if (response.data.success && response.data.data) {
      return response.data.data;
    } else {
      throw new Error(getApiErrorMessage(response.data, 'Failed to fetch latest version information'));
    }
  } catch (error: any) {
    console.error('[versionService] getLatestVersion Error:', error);
    throw error;
  }
};
