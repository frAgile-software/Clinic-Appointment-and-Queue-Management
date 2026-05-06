class ResourceService {
    constructor(publicClient, privateClient, basePath) {
        this.pub = publicClient;
        this.priv = privateClient;
        this.basePath = basePath;
    }
}