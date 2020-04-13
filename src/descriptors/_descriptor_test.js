// Copyright (c) 2014 Titanium I.T. LLC. All rights reserved. For license, see "README" or "LICENSE" file.
"use strict";

var assert = require("../util/assert.js");
var ensure = require("../util/ensure.js");
var Descriptor = require("./descriptor.js");
var Value = require("../values/value.js");

describe("DESCRIPTOR: Descriptor base class", function() {

	var example;

	beforeEach(function() {
		example = new Example(1);
	});

	it("can be extended", function() {
		function Subclass() {}

		Descriptor.extend(Subclass);
		assert.type(new Subclass(), Descriptor);
	});


	describe("assertions helper", function() {

		// These defaults are used when the variable isn't important to the test.
		var a;
		var e;
		var m = "irrelevant message";
		var fn = function() {};

		beforeEach(function() {
			a = new Example(99);
			e = new Example(100);
		});

		it("converts 'actual' and 'expected' to values, describes expected value, and adds colon to message", function() {
			var actual = new Example(1);
			var expected = new Example(2);
			actual.doAssertion(expected, "msg", function(actualValue, expectedValue, expectedDesc, message) {
				assert.objEqual(actualValue, actual.value());
				assert.objEqual(expectedValue, expected.value());
				assert.equal(expectedDesc, "2 (example 2)");
				assert.equal(message, "msg: ");
			});
		});

		it("undefined messages normalize to empty string", function() {
			a.doAssertion(e, undefined, function(actualValue, expectedValue, expectedDesc, message) {
				assert.equal(message, "");
			});
		});

		it("converts primitive expectations to Value instances", function() {
			var expected = 2;
			a.doAssertion(expected, m, function(actualValue, expectedValue, expectedDesc, message) {
				assert.objEqual(expectedValue, new ExampleValue(2));
			});
		});

		it("fails nicely when it can't convert primitive type", function() {
			var actual = new Example(1);
			assert.exception(
				function() { actual.doAssertion("inconvertible string", m, fn ); },
				"Can't compare example 1 to 'inconvertible string'.",
				"strings should be quoted"
			);
			assert.exception(
				function() { actual.doAssertion(function() {}, m, fn); },
				"Can't compare example 1 to a function.",
				"functions should be generically described as functions"
			);
			assert.exception(
				function() { actual.doAssertion(true, m, fn); },
				"Can't compare example 1 to true.",
				"all other primitives should just display the value"
			);
		});

		it("fails nicely when comparison is undefined", function() {
			var actual = new Example(1);
			assert.exception(
				function() { actual.doAssertion(undefined, m, fn); },
				"Can't compare example 1 to undefined. Did you misspell a property name?"
			);
		});

		it("fails nicely when comparing to classes that aren't values or descriptors", function() {
			function IncompatibleClass() {}

			var actual = new Example(1);
			assert.exception(
				function() { actual.doAssertion(new IncompatibleClass(), m, fn); },
				"Can't compare example 1 to IncompatibleClass instances."
			);
		});

		it("fails nicely when comparing to incompatible descriptors", function() {
			var actual = new Example(1);
			assert.exception(
				function() { actual.doAssertion(new IncompatibleExample(), "my message", fn); },
				"my message: Error in test. Use a different 'expected' parameter.\n" +
					"Attempted to compare two incompatible types:\n" +
					"  'actual' type:   Example (example 1)\n" +
					"  'expected' type: IncompatibleExample (incompatible)"
			);
		});

		it("fails nicely when descriptor fails to convert to value", function() {
			var error = new ToValueErrorDescriptor();

			var actual = new Example(1);
			assert.exception(
				function() { actual.doAssertion(new ToValueErrorDescriptor(), m, fn); },
				"Can't compare example 1 to " + error + ": ErrorDescriptor.value() error"
			);
		});

		it("fails nicely when stringifying value fails");

		it("fails nicely when assertion fails");

		it("something something--check comparing X position to Y position");

	});


	describe("should.equal()", function() {

		it("does nothing when equal", function() {
			var actual = new Example(1);
			assert.noException(
				function() { actual.should.equal(1); }
			);
		});

		it("throws exception when not equal", function() {
			var actual = new Example(1);
			assert.exception(
				function() { actual.should.equal(new Example(2), "my message"); },
				"my message: example 1 should be larger.\n" +
					"  Expected: 2 (example 2)\n" +
					"  But was:  1"
			);


			// my message: Error in test. Use a different 'expected' parameter.
			// Attempted to compare two incompatible types:
			//   'expected' type: Example (example 1)
			//   'actual' type:   IncompatibleExample (incompatible example)

		});

	});

	describe("should.notEqual()", function() {

		it("does nothing when not equal", function() {
			var example = new Example(1);
			assert.noException(
				function() { example.should.notEqual(2); }
			);
		});

		it("throws exception when equal", function() {
			var example = new Example(1);
			assert.exception(
				function() { example.should.notEqual(new Example(1), "my message"); },
				"my message: example 1 shouldn't be 1.\n" +
					"  Expected: anything but 1 (example 1)\n" +
					"  But was:  1"
			);
		});

	});


	describe("diff (legacy support for deprecated QElement.equals() and QElement.diff())", function() {

		it("returns empty string when no difference", function() {
			assert.equal(example.diff(example), "");
		});

		it("describes differences between a descriptor and a value", function() {
			assert.equal(
				example.diff(2),
				"example 1 should be larger.\n" +
					"  Expected: 2\n" +
					"  But was:  1"
			);
		});

		it("describes differences between two descriptors", function() {
			assert.equal(
				example.diff(new Example(2)),
				"example 1 should be larger.\n" +
					"  Expected: 2 (example 2)\n" +
					"  But was:  1"
			);
		});

		it("converts values before comparing them", function() {
			assert.equal(example.diff(1), "");
		});

		it("wraps diff errors in an explanation", function() {
			var error = new ToValueErrorDescriptor();

			assert.exception(function() {
				example.diff(error);
			}, "Can't compare " + example + " to " + error + ": ErrorDescriptor.value() error");
		});

		it("fails nicely when diffing 'undefined' accidentally", function() {
			assert.exception(function() {
				example.diff(undefined);
			}, "Can't compare example 1 to undefined. Did you misspell a property name?");
		});

		it("fails nicely when diffing against unrecognized primitives (and similar hardcoded values)", function() {
			assertError(true, "true");
			assertError("foo", "'foo'");
			assertError(null, "null");
			assertError(function() {}, "a function");
			assertError({}, "Object instances");

			function assertError(arg, expected) {
				assert.exception(function() {
					example.diff(arg);
				}, "Can't compare example 1 to " + expected + ".");
			}
		});

		it("doesn't fail when diffing arbitrary value object", function() {
			assert.noException(function() {
				example.diff(new ExampleValue());
			});
		});
	});


	function Example(number) {
		ensure.signature(arguments, [ [String, Number] ]);
		this.should = this.createShould();
		this._number = number;
	}
	Descriptor.extend(Example);
	Example.prototype.convert = function(arg, type) { if (type === "number") return new ExampleValue(arg); };
	Example.prototype.value = function() { return new ExampleValue(this._number); };
	Example.prototype.toString = function() { return "example " + this._number;};


	function ExampleValue(number) { this._number = number; }
	Value.extend(ExampleValue);
	ExampleValue.prototype.compatibility = function() { return [ ExampleValue ]; };
	ExampleValue.prototype.diff = Value.safe(function diff(expected) {
		var difference = this._number - expected._number;

		if (difference > 0) return "larger";
		else if (difference < 0) return "smaller";
		else return "";
	});
	ExampleValue.prototype.toString = function() { return this._number; };


	function IncompatibleExample() {}
	Descriptor.extend(IncompatibleExample);
	IncompatibleExample.prototype.convert = function(arg, type) { return new IncompatibleValue(); };
	IncompatibleExample.prototype.value = function() { return new IncompatibleValue(); };
	IncompatibleExample.prototype.toString = function() { return "incompatible"; };


	function IncompatibleValue() {}
	Value.extend(IncompatibleValue);
	IncompatibleValue.prototype.compatibility = function() { return [ IncompatibleValue ]; };
	IncompatibleValue.prototype.toString = function() { return "IncompatibleValue.toString()"; };


	function ToValueErrorDescriptor(name) {}
	Descriptor.extend(ToValueErrorDescriptor);
	ToValueErrorDescriptor.prototype.value = function() { throw new Error("ErrorDescriptor.value() error"); };
	ToValueErrorDescriptor.prototype.toString = function() { return "ErrorDescriptor"; };

});