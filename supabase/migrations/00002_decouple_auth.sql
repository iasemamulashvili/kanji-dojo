ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_id_fkey;

ALTER TABLE public.profiles
ALTER COLUMN id SET DEFAULT uuid_generate_v4();
