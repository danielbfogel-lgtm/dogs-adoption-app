-- Add dog preference columns to adopters
alter table public.adopters
  add column size    text    check (size in ('small', 'medium', 'large')),
  add column sheds   boolean,
  add column dog_age text;
