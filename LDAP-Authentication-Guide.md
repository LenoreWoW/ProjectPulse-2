# LDAP Authentication Guide for ProjectPulse

This guide explains how to set up and configure LDAP authentication for ProjectPulse.

## Overview

ProjectPulse supports authentication via LDAP (Lightweight Directory Access Protocol), which allows users to log in using their existing enterprise directory credentials.

When a user logs in via LDAP for the first time:
1. Their account is automatically created in ProjectPulse
2. They are assigned the "User" role by default
3. They are placed in the "Hold" department until an administrator assigns them to the appropriate department

## Configuration

LDAP authentication settings are configured through environment variables in the `.env` file:

```
# LDAP Configuration
LDAP_URL=ldap://ldap.example.com:389
LDAP_BIND_DN=cn=admin,dc=example,dc=com
LDAP_BIND_PASSWORD=admin_password
LDAP_SEARCH_BASE=ou=users,dc=example,dc=com
LDAP_SEARCH_FILTER=(uid={{username}})
```

### Configuration Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `LDAP_URL` | URL of your LDAP server, including protocol and port | `ldap://ldap.example.com:389` |
| `LDAP_BIND_DN` | Distinguished Name used to bind to the LDAP server | `cn=admin,dc=example,dc=com` |
| `LDAP_BIND_PASSWORD` | Password for the bind account | `admin_password` |
| `LDAP_SEARCH_BASE` | The base DN from which to search for users | `ou=users,dc=example,dc=com` |
| `LDAP_SEARCH_FILTER` | Filter to apply when searching for the user entry | `(uid={{username}})` |

## User Attribute Mapping

The LDAP authentication system maps LDAP attributes to ProjectPulse user attributes as follows:

| LDAP Attribute | ProjectPulse Field | Fallback |
|----------------|-------------------|----------|
| `uid` or `sAMAccountName` | `username` | N/A (Required) |
| `mail` or `email` | `email` | N/A (Required) |
| `cn` or `displayName` | `name` | 'LDAP User' |

## Active Directory Configuration

If you're using Active Directory, your configuration might look like this:

```
LDAP_URL=ldap://ad.example.com:389
LDAP_BIND_DN=CN=ServiceAccount,OU=ServiceAccounts,DC=example,DC=com
LDAP_BIND_PASSWORD=password
LDAP_SEARCH_BASE=DC=example,DC=com
LDAP_SEARCH_FILTER=(&(objectClass=user)(sAMAccountName={{username}}))
```

## Testing LDAP Connection

You can test your LDAP connection using tools like `ldapsearch` (for OpenLDAP) or `ldp.exe` (for Active Directory).

Example for OpenLDAP:

```bash
ldapsearch -H ldap://ldap.example.com:389 -D "cn=admin,dc=example,dc=com" -w admin_password -b "ou=users,dc=example,dc=com" "(uid=testuser)"
```

## Troubleshooting

If you encounter issues with LDAP authentication:

1. **Check the server logs** - Authentication errors will be logged in the application logs.
2. **Verify LDAP server connectivity** - Make sure the ProjectPulse server can reach the LDAP server.
3. **Check LDAP credentials** - Verify the bind DN and password are correct.
4. **Verify search filter** - Make sure your search filter matches how usernames are stored in your directory.
5. **Check attribute mapping** - Ensure your users have the required attributes in the LDAP directory.

For further assistance, contact your LDAP administrator or the ProjectPulse support team.

## Security Considerations

- Always use LDAPS (LDAP over SSL) in production environments
- Use a dedicated service account with limited permissions for LDAP binding
- Regularly rotate the LDAP bind password
- Consider implementing IP restrictions for LDAP access 