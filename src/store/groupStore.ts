import { create } from "zustand";
import insforge from "../lib/insforge";
import type { Group } from "../types";

interface GroupState {
  group: Group | null;
  partnerId: string | null;
  loading: boolean;
  fetchGroup: (userId: string) => Promise<void>;
  createGroup: (userId: string) => Promise<void>;
  joinGroup: (code: string, userId: string) => Promise<void>;
  leaveGroup: () => Promise<void>;
  clearGroup: () => void;
}

async function loadGroupAndPartner(groupId: string, myUserId: string) {
  const [{ data: groupData }, { data: membersData }] = await Promise.all([
    insforge.database.from("groups").select("*").eq("id", groupId).single(),
    insforge.database
      .from("group_members")
      .select("user_id")
      .eq("group_id", groupId)
      .neq("user_id", myUserId),
  ]);
  const partner = (membersData as { user_id: string }[] | null)?.[0]?.user_id ?? null;
  return { group: groupData as Group, partnerId: partner };
}

export const useGroupStore = create<GroupState>()((set) => ({
  group: null,
  partnerId: null,
  loading: true,

  clearGroup: () => set({ group: null, partnerId: null }),

  fetchGroup: async (userId: string) => {
    set({ loading: true });
    try {
      const { data: memberData } = await insforge.database
        .from("group_members")
        .select("group_id")
        .eq("user_id", userId)
        .single();

      if (!memberData) {
        set({ group: null, partnerId: null, loading: false });
        return;
      }

      const groupId = (memberData as { group_id: string }).group_id;
      const { group, partnerId } = await loadGroupAndPartner(groupId, userId);
      set({ group, partnerId, loading: false });
    } catch {
      set({ group: null, partnerId: null, loading: false });
    }
  },

  createGroup: async (userId: string) => {
    const { data, error } = await insforge.database.rpc("create_group");
    if (error) throw new Error(error.message);
    const row = (data as { group_id: string; invite_code: string }[])?.[0];
    if (!row) throw new Error("No se pudo crear el grupo");
    const { group, partnerId } = await loadGroupAndPartner(row.group_id, userId);
    set({ group, partnerId });
  },

  joinGroup: async (code: string, userId: string) => {
    const { data: groupId, error } = await insforge.database.rpc("join_group", {
      p_invite_code: code.trim().toUpperCase(),
    });
    if (error) throw new Error(error.message);
    const { group, partnerId } = await loadGroupAndPartner(groupId as string, userId);
    set({ group, partnerId });
  },

  leaveGroup: async () => {
    const { error } = await insforge.database.rpc("leave_group");
    if (error) throw new Error(error.message);
    set({ group: null, partnerId: null });
  },
}));
