-- Profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_read_all_profiles" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "users_manage_own_profile" ON profiles FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Lista items
CREATE TABLE lista_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  edited_by UUID REFERENCES auth.users(id),
  last_edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE lista_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_read_lista" ON lista_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_insert_lista" ON lista_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "authenticated_update_lista" ON lista_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "authenticated_delete_lista" ON lista_items FOR DELETE TO authenticated USING (true);

-- Planes
CREATE TABLE planes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  date DATE,
  created_by UUID REFERENCES auth.users(id),
  edited_by UUID REFERENCES auth.users(id),
  last_edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE planes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_read_planes" ON planes FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_insert_planes" ON planes FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "authenticated_update_planes" ON planes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "authenticated_delete_planes" ON planes FOR DELETE TO authenticated USING (true);

-- Salidas
CREATE TABLE salidas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  date DATE,
  location TEXT,
  created_by UUID REFERENCES auth.users(id),
  edited_by UUID REFERENCES auth.users(id),
  last_edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE salidas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_read_salidas" ON salidas FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_insert_salidas" ON salidas FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "authenticated_update_salidas" ON salidas FOR UPDATE TO authenticated USING (true);
CREATE POLICY "authenticated_delete_salidas" ON salidas FOR DELETE TO authenticated USING (true);

-- Peliculas
CREATE TABLE peliculas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  watched BOOLEAN DEFAULT false,
  genre TEXT,
  poster_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  edited_by UUID REFERENCES auth.users(id),
  last_edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE peliculas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_read_peliculas" ON peliculas FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_insert_peliculas" ON peliculas FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "authenticated_update_peliculas" ON peliculas FOR UPDATE TO authenticated USING (true);
CREATE POLICY "authenticated_delete_peliculas" ON peliculas FOR DELETE TO authenticated USING (true);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  reference_id UUID,
  reference_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_read_own_notifications" ON notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "authenticated_insert_notifications" ON notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "users_update_own_notifications" ON notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Realtime channel patterns
INSERT INTO realtime.channels (pattern, description, enabled) VALUES
  ('lista_items', 'Lista para hacer changes', true),
  ('planes', 'Planes changes', true),
  ('salidas', 'Salidas changes', true),
  ('peliculas', 'Peliculas changes', true),
  ('notifications:%', 'User notifications', true);

-- Triggers for realtime - lista_items
CREATE OR REPLACE FUNCTION notify_lista_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM realtime.publish('lista_items', TG_OP, jsonb_build_object('id', OLD.id, 'op', TG_OP));
    RETURN OLD;
  END IF;
  PERFORM realtime.publish('lista_items', TG_OP, row_to_json(NEW)::jsonb || jsonb_build_object('op', TG_OP));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER lista_realtime
  AFTER INSERT OR UPDATE OR DELETE ON lista_items
  FOR EACH ROW EXECUTE FUNCTION notify_lista_changes();

-- Trigger for notifications
CREATE OR REPLACE FUNCTION notify_user_notification()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM realtime.publish('notifications:' || NEW.user_id::text, 'NEW_NOTIFICATION', row_to_json(NEW)::jsonb);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER notification_realtime
  AFTER INSERT ON notifications
  FOR EACH ROW EXECUTE FUNCTION notify_user_notification();

-- Triggers for planes, salidas, peliculas
CREATE OR REPLACE FUNCTION notify_planes_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM realtime.publish('planes', TG_OP, jsonb_build_object('id', OLD.id, 'op', TG_OP));
    RETURN OLD;
  END IF;
  PERFORM realtime.publish('planes', TG_OP, row_to_json(NEW)::jsonb || jsonb_build_object('op', TG_OP));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE TRIGGER planes_realtime AFTER INSERT OR UPDATE OR DELETE ON planes FOR EACH ROW EXECUTE FUNCTION notify_planes_changes();

CREATE OR REPLACE FUNCTION notify_salidas_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM realtime.publish('salidas', TG_OP, jsonb_build_object('id', OLD.id, 'op', TG_OP));
    RETURN OLD;
  END IF;
  PERFORM realtime.publish('salidas', TG_OP, row_to_json(NEW)::jsonb || jsonb_build_object('op', TG_OP));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE TRIGGER salidas_realtime AFTER INSERT OR UPDATE OR DELETE ON salidas FOR EACH ROW EXECUTE FUNCTION notify_salidas_changes();

CREATE OR REPLACE FUNCTION notify_peliculas_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM realtime.publish('peliculas', TG_OP, jsonb_build_object('id', OLD.id, 'op', TG_OP));
    RETURN OLD;
  END IF;
  PERFORM realtime.publish('peliculas', TG_OP, row_to_json(NEW)::jsonb || jsonb_build_object('op', TG_OP));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE TRIGGER peliculas_realtime AFTER INSERT OR UPDATE OR DELETE ON peliculas FOR EACH ROW EXECUTE FUNCTION notify_peliculas_changes();
