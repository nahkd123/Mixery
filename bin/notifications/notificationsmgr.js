export class NotificationsManager {
    constructor() {
        this.notifications = [];
        this.showingNotification = false;
    }
    hasTag(tag) {
        if (this.showingTags && this.showingTags.includes(tag))
            return true;
        for (let i = 0; i < this.notifications.length; i++) {
            if (this.notifications[i].tags.includes(tag))
                return true;
        }
        return false;
    }
    push(info) {
        this.notifications.push(info);
        if (!this.showingNotification)
            this.run();
    }
    run() {
        if (this.notifications.length === 0)
            return;
        let firstNoti = this.notifications.shift();
        this.showingTags = firstNoti.tags;
        let element = document.createElement("div");
        element.className = "notification opening";
        element.textContent = firstNoti.desc;
        document.body.append(element);
        this.showingNotification = true;
        setTimeout(() => {
            element.classList.remove("opening");
        }, 50);
        setTimeout(() => {
            element.classList.add("closing");
            this.showingNotification = false;
            this.showingTags = undefined;
            this.run();
        }, firstNoti.duration - 500);
        setTimeout(() => {
            element.remove();
        }, firstNoti.duration);
    }
}