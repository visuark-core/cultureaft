// Re-export the UserList component from the UserManagement subfolder.
// The top-level file used to be empty which could cause imports to resolve
// to an empty module and lead to runtime issues / freezes. Re-exporting
// ensures callers get the real implementation.
export { default } from './UserManagement/UserList';
