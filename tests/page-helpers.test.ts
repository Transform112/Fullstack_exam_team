import { describe, expect, it } from "vitest";
import {
  checkPageAccess,
  effectiveStatus,
  firstName,
  refreshThumbnail,
  serializeOwnerPage,
  serializePublicPage,
} from "@/lib/page-helpers";
import type { PageLean } from "@/models/Page";
import type { UserLean } from "@/models/User";

const ownerId = "64b7f0c2f1a2b3c4d5e6f7a8";

function makePage(overrides: Partial<PageLean> = {}): PageLean {
  return {
    _id: { toString: () => "64b7f0c2f1a2b3c4d5e6f7a9" } as never,
    ownerId: { toString: () => ownerId } as never,
    slug: "riya-birthday-7f3a",
    status: "PUBLISHED",
    rev: 3,
    draftStep: 6,
    recipient: { name: "Riya Sharma", nickname: "Riyu", relation: "Best friend" },
    from: "Arjun",
    language: "HINGLISH",
    messages: ["Tu best hai yaar"],
    memories: [],
    media: [
      {
        id: "m1",
        type: "image",
        url: "https://res.cloudinary.com/demo/image/upload/w_100/sample.jpg",
        publicId: "seed/sample.jpg",
        w: 1080,
        h: 1350,
        duration: null,
        caption: "",
        order: 0,
      },
    ],
    theme: {
      templateId: "neon-night",
      accent: "#FF4FA3",
      font: "default",
      music: "soft-piano",
      decorations: [],
    },
    settings: { wishesWall: true, showViews: false },
    stats: { views: 0, uniqueViews: 0, wishes: 0 },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as PageLean;
}

const owner = { _id: { toString: () => ownerId } } as unknown as UserLean;
const stranger = { _id: { toString: () => "64b7f0c2f1a2b3c4d5e6f7ff" } } as unknown as UserLean;
const admin = {
  _id: { toString: () => "64b7f0c2f1a2b3c4d5e6f700" },
  role: "ADMIN",
} as unknown as UserLean;

// PAGE-3: the computed status is derived from revealAt, never stored ahead of time.
describe("effectiveStatus", () => {
  it("keeps DRAFT, UNPUBLISHED and DISABLED unchanged", () => {
    expect(effectiveStatus(makePage({ status: "DRAFT" }))).toBe("DRAFT");
    expect(effectiveStatus(makePage({ status: "UNPUBLISHED" }))).toBe("UNPUBLISHED");
    expect(effectiveStatus(makePage({ status: "DISABLED" }))).toBe("DISABLED");
  });

  it("returns SCHEDULED for a future revealAt and PUBLISHED once it passes", () => {
    const future = new Date(Date.now() + 60_000);
    const past = new Date(Date.now() - 60_000);
    expect(effectiveStatus(makePage({ revealAt: future }))).toBe("SCHEDULED");
    expect(effectiveStatus(makePage({ revealAt: past }))).toBe("PUBLISHED");
    expect(effectiveStatus(makePage({ revealAt: null }))).toBe("PUBLISHED");
  });
});

describe("firstName", () => {
  it("returns the first whitespace separated word", () => {
    expect(firstName("Riya Sharma")).toBe("Riya");
    expect(firstName("  Riya  ")).toBe("Riya");
    expect(firstName(undefined)).toBe("");
  });
});

// PAGE-3/PAGE-4: the access decision order is the security contract.
describe("checkPageAccess", () => {
  it("hides a disabled page from everyone, including the owner and admins", () => {
    const page = makePage({ status: "DISABLED" });
    expect(checkPageAccess(page, owner, undefined).result).toBe("UNAVAILABLE");
    expect(checkPageAccess(page, admin, undefined).result).toBe("UNAVAILABLE");
    expect(checkPageAccess(page, null, undefined).result).toBe("UNAVAILABLE");
  });

  it("treats a draft as not found", () => {
    expect(checkPageAccess(makePage({ status: "DRAFT" }), null, undefined).result).toBe(
      "NOT_FOUND",
    );
  });

  it("hides an unpublished page from strangers but not from the owner", () => {
    const page = makePage({ status: "UNPUBLISHED" });
    expect(checkPageAccess(page, null, undefined).result).toBe("UNAVAILABLE");
    expect(checkPageAccess(page, stranger, undefined).result).toBe("UNAVAILABLE");
    expect(checkPageAccess(page, owner, undefined).result).toBe("OK");
  });

  it("locks a scheduled page for strangers but not for the owner or an admin", () => {
    const page = makePage({ revealAt: new Date(Date.now() + 3600_000) });
    expect(checkPageAccess(page, null, undefined).result).toBe("LOCKED_SCHEDULED");
    expect(checkPageAccess(page, owner, undefined).result).toBe("OK");
    expect(checkPageAccess(page, admin, undefined).result).toBe("OK");
  });

  it("locks a password page until the unlock token matches page and revision", () => {
    const page = makePage({
      settings: { wishesWall: true, showViews: false, passwordHash: "$2a$10$hash" },
    });
    expect(checkPageAccess(page, null, undefined).result).toBe("LOCKED_PASSWORD");
    expect(checkPageAccess(page, owner, undefined).result).toBe("OK");
  });
});

// Rule 11: no public or owner payload may carry secrets.
describe("serializers", () => {
  it("owner payload exposes hasPassword but never passwordHash or ownerId", () => {
    const page = makePage({
      settings: { wishesWall: true, showViews: false, passwordHash: "$2a$10$hash" },
    });
    const out = serializeOwnerPage(page);
    expect(out.settings.hasPassword).toBe(true);
    expect(JSON.stringify(out)).not.toContain("passwordHash");
    expect(JSON.stringify(out)).not.toContain(ownerId);
  });

  it("public payload only includes views when showViews is true", () => {
    const hidden = serializePublicPage(
      makePage({ stats: { views: 47, uniqueViews: 31, wishes: 3 } }),
      true,
    );
    expect("views" in hidden).toBe(false);
    const shown = serializePublicPage(
      makePage({
        settings: { wishesWall: true, showViews: true },
        stats: { views: 47, uniqueViews: 31, wishes: 3 },
      }),
      true,
    );
    expect(shown.views).toBe(47);
    expect(JSON.stringify(shown)).not.toContain("ownerId");
  });
});

describe("refreshThumbnail", () => {
  it("uses the lowest order image with a 400x500 crop", () => {
    const page = makePage();
    expect(refreshThumbnail(page)).toContain("w_400,h_500,c_fill,g_auto,f_auto,q_auto");
  });

  it("returns an empty string when there is no image", () => {
    const page = makePage({ media: [] });
    expect(refreshThumbnail(page)).toBe("");
  });
});
