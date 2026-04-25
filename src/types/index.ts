export interface Profile {
  id: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  /** FCM device token (Android), optional column in `profiles` */
  fcm_token?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ListaItem {
  id: string;
  content: string;
  completed: boolean;
  created_by: string;
  edited_by: string | null;
  last_edited_at: string | null;
  created_at: string;
  creator?: Profile;
  editor?: Profile;
}

export interface Plan {
  id: string;
  title: string;
  description: string | null;
  date: string | null;
  created_by: string;
  edited_by: string | null;
  last_edited_at: string | null;
  created_at: string;
  creator?: Profile;
  editor?: Profile;
}

export interface Salida {
  id: string;
  title: string;
  description: string | null;
  date: string | null;
  location: string | null;
  created_by: string;
  edited_by: string | null;
  last_edited_at: string | null;
  created_at: string;
  creator?: Profile;
  editor?: Profile;
}

export interface Pelicula {
  id: string;
  title: string;
  description: string | null;
  watched: boolean;
  genre: string | null;
  poster_url: string | null;
  created_by: string;
  edited_by: string | null;
  last_edited_at: string | null;
  created_at: string;
  creator?: Profile;
  editor?: Profile;
}

export type PostTargetType = "planes" | "salidas" | "peliculas"

export interface PostReaction {
  id: string
  group_id: string
  target_type: PostTargetType
  target_id: string
  user_id: string
  emoji: string
  created_at: string
}

export interface PostComment {
  id: string
  group_id: string
  target_type: PostTargetType
  target_id: string
  user_id: string
  parent_comment_id: string | null
  content: string
  created_at: string
  updated_at: string | null
}

export interface PostCommentNode extends PostComment {
  replies: PostCommentNode[]
  author?: Profile
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_by: string | null;
  reference_id: string | null;
  reference_type: string | null;
  group_id: string | null;
  created_at: string;
}

export interface Group {
  id: string;
  invite_code: string;
  created_by: string;
  created_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  joined_at: string;
}

export type Section = "planes" | "lista" | "salidas" | "peliculas" | "perfil";
