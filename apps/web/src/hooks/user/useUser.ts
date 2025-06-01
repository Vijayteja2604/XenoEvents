import { api } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";

interface UserResponse {
  id: string;
  fullName: string;
  phoneNumber: string | null;
  profilePicture: string | null;
}

export const useEditAccount = () => {
  const editAccountMutation = useMutation<
    UserResponse,
    Error,
    {
      fullName: string;
      phoneNumber?: string | null;
      profilePicture?: string | null;
    }
  >({
    mutationFn: (data) => api.editAccount(data),
  });

  return {
    editAccount: editAccountMutation,
  };
};

export const useDeleteAccount = () => {
  const deleteAccountMutation = useMutation<{ message: string }, Error>({
    mutationFn: () => api.deleteAccount(),
  });

  return {
    deleteAccount: deleteAccountMutation,
    isLoading: deleteAccountMutation.isPending,
  };
};
