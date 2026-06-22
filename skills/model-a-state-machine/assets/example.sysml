// example.sysml — a worked state machine: a subscription lifecycle.
// Note the REOPENABLE terminal (cancelled -> trialing via Reactivate): a terminal state is not a grave.
// Syntax-checked against a SysML v2 parser (syntaxErrors == 0).
package Subscription {
	doc /* A subscription's lifecycle as a state machine: trialing -> active, payment trouble + recovery,
	     cancellation (reopenable), and expiry (a hard terminal). */

	item def Activate;
	item def PaymentFailed;
	item def PaymentRecovered;
	item def Cancel;
	item def Expire;
	item def Reactivate;

	state def SubscriptionLifecycle {
		entry; then trialing;
		state trialing;
		state active;
		state pastDue;
		state cancelled;
		state expired;
		transition tActivate   first trialing  accept Activate         then active;
		transition tFail       first active    accept PaymentFailed    then pastDue;
		transition tRecover    first pastDue   accept PaymentRecovered then active;
		transition tCancel     first active    accept Cancel           then cancelled;
		transition tExpire     first pastDue   accept Expire           then expired;
		transition tReactivate first cancelled accept Reactivate       then trialing;   // reopenable terminal
	}
}
