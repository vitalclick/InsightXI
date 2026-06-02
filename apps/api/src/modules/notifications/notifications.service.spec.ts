import { NotificationsService } from "./notifications.service";
import { InMemoryNotificationStore } from "./in-memory-notification.store";

describe("NotificationsService", () => {
  let service: NotificationsService;

  beforeEach(() => {
    service = new NotificationsService(new InMemoryNotificationStore());
  });

  it("creates and lists notifications for a user, newest first", async () => {
    await service.notify("u1", { type: "welcome", title: "First", body: "b" });
    await service.notify("u1", { type: "premium", title: "Second", body: "b", link: "/premium" });
    const list = await service.list("u1");
    expect(list.map((n) => n.title)).toEqual(["Second", "First"]);
    expect(list[0].link).toBe("/premium");
    expect(list.every((n) => !n.read)).toBe(true);
  });

  it("scopes notifications to their owner", async () => {
    await service.notify("u1", { type: "system", title: "mine", body: "b" });
    await service.notify("u2", { type: "system", title: "theirs", body: "b" });
    expect((await service.list("u2")).map((n) => n.title)).toEqual(["theirs"]);
    expect(await service.unreadCount("u1")).toBe(1);
  });

  it("marks a single notification read (only for its owner)", async () => {
    await service.notify("u1", { type: "system", title: "x", body: "b" });
    const [n] = await service.list("u1");
    expect((await service.markRead("u2", n.id)).ok).toBe(false);
    expect((await service.markRead("u1", n.id)).ok).toBe(true);
    expect(await service.unreadCount("u1")).toBe(0);
  });

  it("marks all read", async () => {
    await service.notify("u1", { type: "system", title: "a", body: "b" });
    await service.notify("u1", { type: "system", title: "b", body: "b" });
    await service.markAllRead("u1");
    expect(await service.unreadCount("u1")).toBe(0);
    expect((await service.list("u1")).every((n) => n.read)).toBe(true);
  });

  it("erases only the target user's notifications", async () => {
    await service.notify("u1", { type: "system", title: "a", body: "b" });
    await service.notify("u2", { type: "system", title: "keep", body: "b" });
    await service.deleteAllForUser("u1");
    expect(await service.list("u1")).toEqual([]);
    expect((await service.list("u2")).map((n) => n.title)).toEqual(["keep"]);
  });
});
