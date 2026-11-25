# Troubleshooting simplix-sync

Symptoms an application meets when instances exchange messages, the cause of each and what to change.

| Symptom | Cause | What to do |
|---|---|---|
| The instance that broadcasts does not see its own change | a sender does not receive its own message | change the local state in the same method that broadcasts |
| No instance receives anything, and the log says `SimpliX Sync: local mode (NoOp broadcaster)` | the mode is `LOCAL`, or the library or the connection of the broker is missing | set `mode: DISTRIBUTED` and add the broker's dependency and connection |
| An instance has old state after it restarted | messages sent while it was away are not stored | load the state at start and run a `ReconciliationScheduler` |
| A handler fails to decode a message | instances run different versions of the message class, or two message types share a channel name | add fields in a way old versions can read, and use one channel per type |
| With NATS, a channel never delivers | the channel name is not a valid subject | use a name without spaces, with `.` or `-` as separators |
| A counter drifts between instances | messages carry an instruction such as "add one", and one was lost or applied twice | send the new value or a version, so a message can be applied again or skipped |
| `simplix.sync.distributed.redis-enabled: false` does not switch Redis off | no code reads the property | set `broker: NATS`, or `mode: LOCAL` |

## Related documents

- [How simplix-sync works](en/sync/how-it-works.md)
- [Keeping state consistent](en/sync/keeping-state-consistent.md)
