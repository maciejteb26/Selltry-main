import { enqueuePublish, publishQueue, startPublishWorker } from './publish.job';

export function startWorkers(): void {
  startPublishWorker();
}

export { publishQueue, enqueuePublish };
