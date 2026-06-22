// example.sysml — a worked constraint model: rules over a battery pack's measurements.
// Shows the core loop: author REUSABLE constraint defs once, then ASSERT them on a part's
// attributes (binding each `in` parameter to a real attribute). A constraint is a CHECKABLE
// boolean spec over data — distinct from a requirement (prose intent). This validator PARSES
// constraints; it does NOT evaluate them (they are a spec, like well-formedness.sysml). (syntaxErrors == 0.)
package BatteryPack {
	import ScalarValues::*;
	doc /* A battery pack's invariants as reusable constraints, asserted on its measured attributes.
	     Each constraint def is a parameterized boolean rule; each `assert constraint` binds the rule
	     to this pack's data — the spec made into a contract on a concrete thing. */

	// reusable rules — parameterized, named, composable. Author once; assert anywhere.
	constraint def InClosedRange {              // value sits within [lo, hi] inclusive
		in v : Integer;
		in lo : Integer;
		in hi : Integer;
		v >= lo and v <= hi
	}
	constraint def Positive {                   // value is strictly positive
		in v : Integer;
		v > 0
	}
	constraint def ChargeConsistent {           // a derived consistency rule across two attributes
		in soc : Integer;                       // state of charge (%)
		in empty : Boolean;
		empty implies soc == 0                  // if flagged empty, charge must read zero (== not =)
	}

	// the subject part: data (attributes) + the rules asserted over it.
	part def Cell {
		attribute voltageMv : Integer;          // millivolts
		attribute soc : Integer;                // state of charge, percent
		attribute flaggedEmpty : Boolean;

		// ASSERT each rule, binding its `in` parameters to THIS cell's attributes.
		assert constraint voltageInRange : InClosedRange {
			in v = voltageMv;
			in lo = 2500;                       // a literal bound is a legal binding
			in hi = 4200;
		}
		assert constraint socInRange : InClosedRange {
			in v = soc;
			in lo = 0;
			in hi = 100;
		}
		assert constraint voltagePositive : Positive { in v = voltageMv; }
		assert constraint chargeOk : ChargeConsistent {
			in soc = soc;
			in empty = flaggedEmpty;
		}
	}
}
