import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { toast } from "@/hooks/use-toast";

export interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export function useUserProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["user-profile", user?.id],
    enabled: Boolean(user?.id),
    staleTime: 30 * 60 * 1000, // 30 minutos
    queryFn: async (): Promise<UserProfile | null> => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        return null;
      }

      return data;
    },
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: Partial<UserProfile>) => {
      if (!user?.id) throw new Error("No user logged in");

      console.log("Updating profile with data:", updates);

      const { data, error } = await supabase
        .from("profiles")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
        .select()
        .single();

      if (error) {
        console.error("Update profile error:", error);
        throw error;
      }

      console.log("Profile updated successfully:", data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram salvas com sucesso.",
      });
    },
    onError: (error) => {
      console.error("Error updating profile:", error);
      toast({
        title: "Erro ao atualizar perfil",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive",
      });
    },
  });

  const uploadAvatar = useMutation({
    mutationFn: async (file: File) => {
      if (!user?.id) throw new Error("No user logged in");

      console.log("Starting avatar upload for user:", user.id);

      // Delete old avatar if exists
      if (profile?.avatar_url) {
        const oldPath = profile.avatar_url.split("/").pop();
        if (oldPath) {
          console.log("Deleting old avatar:", oldPath);
          await supabase.storage
            .from("avatars")
            .remove([`${user.id}/${oldPath}`]);
        }
      }

      // Upload new avatar
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      console.log("Uploading to path:", filePath);

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      console.log("Avatar uploaded, public URL:", publicUrl);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);

      if (updateError) {
        console.error("Error updating profile with avatar URL:", updateError);
        throw updateError;
      }

      console.log("Profile updated with new avatar URL");
      return publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      toast({
        title: "Foto atualizada!",
        description: "Sua foto de perfil foi alterada com sucesso.",
      });
    },
    onError: (error) => {
      console.error("Error uploading avatar:", error);
      toast({
        title: "Erro ao enviar foto",
        description: "Não foi possível fazer upload da imagem.",
        variant: "destructive",
      });
    },
  });

  const deleteAvatar = useMutation({
    mutationFn: async () => {
      if (!user?.id || !profile?.avatar_url) return;

      const oldPath = profile.avatar_url.split("/").pop();
      if (oldPath) {
        await supabase.storage
          .from("avatars")
          .remove([`${user.id}/${oldPath}`]);
      }

      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      toast({
        title: "Foto removida",
        description: "Sua foto de perfil foi removida.",
      });
    },
    onError: (error) => {
      console.error("Error deleting avatar:", error);
      toast({
        title: "Erro ao remover foto",
        description: "Não foi possível remover a imagem.",
        variant: "destructive",
      });
    },
  });

  return {
    profile,
    isLoading,
    updateProfile: updateProfile.mutate,
    uploadAvatar: uploadAvatar.mutate,
    deleteAvatar: deleteAvatar.mutate,
    isUpdating: updateProfile.isPending,
    isUploading: uploadAvatar.isPending,
  };
}
