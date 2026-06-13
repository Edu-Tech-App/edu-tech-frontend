import { authApi } from "./auth.service";
import { booksApi } from "./books.service";
import { type BookCategory } from "./catalogs";
import { gradesApi } from "./grades.service";
import { API_URL_PUBLIC } from "./http";
import { loansApi } from "./loans.service";
import { participantsApi } from "./participants.service";
import { reportsApi } from "./reports.service";
import { statsApi } from "./stats.service";
import { studyRoomsApi } from "./study-rooms.service";
import { subjectsApi } from "./subjects.service";
import { systemCatalogsApi } from "./system-catalogs.service";
import { usersApi } from "./users.service";

export { API_URL_PUBLIC };
export type { BookCategory };

export const api = {
  ...authApi,
  ...usersApi,
  ...booksApi,
  ...subjectsApi,
  ...studyRoomsApi,
  ...loansApi,
  ...participantsApi,
  ...gradesApi,
  ...statsApi,
  ...reportsApi,
  ...systemCatalogsApi,
};
