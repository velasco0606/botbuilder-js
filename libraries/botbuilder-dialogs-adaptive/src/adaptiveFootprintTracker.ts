export class AdaptiveFootprintTracker {
    public static async reportActionPath(path: string): Promise<void> {
        console.log(`Running action: ${path}`);
    }

    public static async reportConditionPath(path: string): Promise<void> {
        console.log(`Triggerd condition: ${path}`);
    }
}