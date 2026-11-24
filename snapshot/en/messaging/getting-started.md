# Getting started with simplix-messaging

This page publishes a message and handles it, first inside one process and then through a broker.

## Step 1. Define the message

```java
public record LoanOpened(String loanId, String memberId) {
}
```

A message travels as bytes. A record that is written and read as JSON keeps both sides independent of each other's classes.

## Step 2. Publish

```java
@Service
@RequiredArgsConstructor
public class LoanDesk {

    private final MessagePublisher messagePublisher;

    public void open(String loanId, String memberId) {
        byte[] payload = JsonCodec.serialize(new LoanOpened(loanId, memberId));
        messagePublisher.publish(Message.ofBytes("loan-opened", payload));
    }
}
```

`JsonCodec.serialize` turns the record into JSON bytes, and `Message.ofBytes` names the channel. A channel is created by the first message or the first handler; nothing has to be declared.

## Step 3. Handle

```java
@Component
public class LoanNotifier {

    @MessageHandler(channel = "loan-opened", group = "notifier")
    public void onLoanOpened(Message<byte[]> message) {
        LoanOpened event = JsonCodec.deserialize(message.getPayload(), LoanOpened.class);
        // notify the member
    }
}
```

A method of a Spring bean marked `@MessageHandler` is subscribed when the application is ready. `group` names the consumer group: every group gets every message of the channel, and inside a group one instance gets it. When the method returns, the message is acknowledged.

## Step 4. Run it

Call `LoanDesk.open("l-42", "m-7")`. With the default `local` broker the handler runs in the same process shortly afterwards, and the health endpoint reports the broker.

```text
BrokerCapabilities[consumerGroups=true, replay=true, ordering=true, deadLetter=false, scheduledDelivery=true, nativeDedup=false, nativeRequestReply=false]
```

## Step 5. Use a broker

```groovy
dependencies {
    implementation "io.nats:jnats"
}
```

```yaml
simplix:
  messaging:
    broker: nats
    nats:
      servers: nats://localhost:4222
```

The publisher and the handler stay as they are. With the broker switched, messages pass NATS JetStream: they survive a restart, and several instances of the application share the work of a group.

## Next steps

- [Publishing messages](en/messaging/publishing-messages.md)
- [Handling messages](en/messaging/handling-messages.md)
- [Choosing a broker](en/messaging/choosing-a-broker.md)
