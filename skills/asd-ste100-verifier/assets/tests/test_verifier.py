import unittest
from pathlib import Path
from ste_verifier.dictionary import STEDictionary
from ste_verifier.checker import STEChecker


class TestSTEVerifier(unittest.TestCase):
    def setUp(self):
        self.dict = STEDictionary()
        self.checker = STEChecker(self.dict)

    def test_unapproved_vocab_detection(self):
        text = "Prior to commencing the test, utilize the special tool in order to open the valve."
        violations = self.checker.check_text(text)
        rule_ids = [v.rule_id for v in violations]
        self.assertIn("STE-001-UNAPPROVED-VOCAB", rule_ids)
        
        unapp_words = [v.original_text.lower() for v in violations if v.rule_id == "STE-001-UNAPPROVED-VOCAB"]
        self.assertIn("prior to", unapp_words)
        self.assertIn("utilize", unapp_words)
        self.assertIn("in order to", unapp_words)

    def test_passive_voice_detection(self):
        text = "The oil filter was removed by the technician."
        violations = self.checker.check_text(text)
        rule_ids = [v.rule_id for v in violations]
        self.assertIn("STE-003-PASSIVE-VOICE", rule_ids)

    def test_sentence_length_limit(self):
        # 26 words
        long_sentence = "This is a very long descriptive sentence that contains more than twenty five words in order to test if the ASD STE100 verification engine properly flags long sentences."
        violations = self.checker.check_text(long_sentence)
        rule_ids = [v.rule_id for v in violations]
        self.assertIn("STE-002-SENTENCE-LENGTH", rule_ids)

    def test_autofix(self):
        text = "Prior to starting, utilize the tool in order to start."
        fixed = self.checker.autofix_text(text)
        self.assertNotIn("utilize", fixed)
        self.assertIn("use", fixed)


if __name__ == "__main__":
    unittest.main()
