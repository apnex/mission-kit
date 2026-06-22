// specialization.sysml — subtyping + redefinition + composition.
// `:>` makes one part def a SUBTYPE of another (specialize); `:>>` REDEFINES an attribute's value on an
// instance. An `abstract part def` is a base not instantiated directly. (syntaxErrors == 0.)
package WorkerKinds {
	import ScalarValues::*;
	doc /* A worker hierarchy: an abstract base, two subtypes, a pool that owns workers, and a concrete instance. */

	abstract part def Worker {
		attribute id : String;
		attribute parallelism : Integer;
	}
	part def CpuWorker :> Worker { attribute cores : Integer; }   // CpuWorker IS-A Worker (specialize)
	part def GpuWorker :> Worker { attribute vram : Integer; }

	part def Pool {
		part workers : Worker[1..*];                              // owns workers (any subtype)
	}
	part fastPool : Pool {
		part w : CpuWorker :> workers {                          // a concrete worker, subsetting `workers`
			:>> parallelism = 8;                                 // redefine the inherited attribute value
			:>> cores = 16;
		}
	}
}
