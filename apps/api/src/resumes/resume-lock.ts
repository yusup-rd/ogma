import { HttpException, HttpStatus } from "@nestjs/common";

export function assertResumeUnlocked(resume: { locked: boolean }) {
  if (resume.locked)
    throw new HttpException(
      "Unlock this CV before saving changes.",
      HttpStatus.LOCKED,
    );
}
