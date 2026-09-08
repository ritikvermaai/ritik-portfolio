# V37 Login policy

- First 2 wrong passwords: no cooldown.
- 3rd wrong password: 60-second cooldown.
- 4th: 120 seconds.
- 5th: 180 seconds.
- 6th: 240 seconds.
- 7th and later: 300 seconds maximum.
- Successful login deletes the throttle record and resets AdminCredential.failedLoginAttempts to 0.
- Legacy throttle records are reset via policyVersion 2 so old V36 lockouts do not carry into the new policy.
