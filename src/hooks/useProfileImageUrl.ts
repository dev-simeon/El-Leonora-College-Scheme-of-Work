import { useQuery } from "@tanstack/react-query";
import { Configuration } from "../api/generated/configuration";
import { StaffsApi } from "../api/generated/endpoints/staffs-api";
import { StudentsApi } from "../api/generated/endpoints/students-api";
import api, { API_BASE_URL } from "../services/api";
import { useAuth } from "../context/AuthContext";

const studentsApi = new StudentsApi(
  new Configuration({ basePath: API_BASE_URL }),
  API_BASE_URL,
  api,
);
const staffsApi = new StaffsApi(
  new Configuration({ basePath: API_BASE_URL }),
  API_BASE_URL,
  api,
);

/** Reads the signed-in user's profile photo URL for display; no editing/upload. */
export function useProfileImageUrl() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["profile-image", user?.role, user?.id],
    enabled: Boolean(user?.id),
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (!user?.id) return null;

      try {
        if (user.role === "student") {
          const response = await studentsApi.getStudentProfile({ id: user.id });
          return response.data.success
            ? response.data.data?.profileImageUrl || null
            : null;
        }

        const response = await staffsApi.getStaffById({ id: user.id });
        return response.data.success
          ? response.data.data?.profileImageUrl || null
          : null;
      } catch {
        // Keep the existing initials/default avatar visible if the profile
        // photo is unavailable or the details endpoint cannot be reached.
        return null;
      }
    },
  });
}
