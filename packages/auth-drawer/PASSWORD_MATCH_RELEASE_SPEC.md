# Password Match Release Spec

This document defines the expected behavior for register-mode password confirmation in `auth-drawer`.

## Goal

Provide immediate, low-noise feedback when the password and confirm-password fields diverge, without turning every keystroke into a hard error.

The rule is:
- show feedback only in register mode
- do not show anything until both fields have content
- show mismatch feedback while typing
- show success feedback only as a quiet inline confirmation
- keep submit-time validation as the source of truth

## Interaction Rules

### Field visibility

- `Password` is always visible.
- `Confirm password` is visible only in register mode.
- Live match feedback is hidden in login mode.

### Live feedback

- If password and confirm are both empty, show nothing.
- If one field has content and the other is empty, show nothing.
- If both have content and they match, show a subtle success state.
- If both have content and they differ, show a subtle mismatch state.
- If the user edits either field after a feedback state is shown, the UI should update immediately.

### Submit-time validation

- Submit validation must still reject mismatched passwords.
- If the form is submitted with a mismatch, the confirm field should receive a real error state.
- Live success feedback must not replace submit validation.

### Accessibility

- Live feedback should use a polite status announcement, not repeated alert spam.
- Error text should remain associated with the confirm field.
- `aria-invalid` should only be set when the field is actually invalid.
- Reduced-motion users should still get the same state change, just with less animation.

### Motion

- Use short transitions only.
- Keep movement limited to opacity and small vertical/scale shifts.
- The feedback should feel interruptible while typing.
- Do not add shake or large attention-grabbing motion for a normal mismatch.

## Release Checklist

### Behavior

- [ ] Empty password and empty confirm show no feedback
- [ ] Password filled and confirm empty show no feedback
- [ ] Confirm filled and password empty show no feedback
- [ ] Exact match shows quiet success state
- [ ] One-character mismatch shows subtle mismatch state
- [ ] Deleting back to empty clears the live state
- [ ] Editing either field updates the state immediately
- [ ] Switching from register to login clears the live confirm state
- [ ] Switching back to register restores only current typed values, not stale validation
- [ ] Submit with mismatch shows a hard error on confirm
- [ ] Submit with match proceeds normally

### Input scenarios

- [ ] Typing slowly
- [ ] Typing quickly
- [ ] Pasting password into both fields
- [ ] Pasting password into one field only
- [ ] Password manager autofill
- [ ] Browser autocomplete
- [ ] Confirm field visibility toggle while feedback is visible

### Accessibility

- [ ] Screen reader announcement is polite and non-repetitive
- [ ] `aria-describedby` points to the correct message id
- [ ] `aria-invalid` appears only when invalid
- [ ] Keyboard-only flow works without surprises
- [ ] Reduced-motion mode still communicates mismatch and success clearly

### Visual polish

- [ ] No layout jump when feedback appears or disappears
- [ ] Success state is visually quieter than error state
- [ ] Error state is readable but not harsh
- [ ] Animation duration stays under 300ms

## Edge Cases To Verify

- Password changes after confirm already matched
- Confirm changes after password already matched
- Password is longer than confirm
- Confirm is longer than password
- One field is filled with whitespace only
- User clears the password field after confirm was filled
- User clears the confirm field after password was filled
- User toggles between login and register repeatedly
- User submits immediately after typing the last character

## Acceptance Criteria

The feature is ready for release when:

- the live state feels immediate but quiet
- mismatch is visible before submit
- submit validation still blocks invalid registration
- accessibility does not regress
- the full edge-case checklist has been manually checked in the showcase

