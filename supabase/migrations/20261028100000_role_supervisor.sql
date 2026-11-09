-- Migration 6: fourth platform role, مشرف المراجعة (review supervisor).
-- Enum values cannot be used in the transaction that adds them, so this file only adds the value;
-- helpers and policies for the role are in the next migration.
-- Roles in Release 1: admin (مدير النظام), supervisor (مشرف المراجعة), evaluator (مدقق), organization (منظمة).
-- Legacy values 'user' and 'individual' stay in the enum for existing rows; the UI ignores them.

alter type public.app_role add value if not exists 'supervisor';
