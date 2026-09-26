# Week 08 – Continuous Delivery with GitHub Actions and Kubernetes

In Week 07, we implemented a Continuous Integration (CI) pipeline using GitHub Actions. The pipeline automatically tested the backend services, built Docker images, and pushed the successfully built images to Azure Container Registry (ACR).

In Week 08, we extend this workflow to implement **Continuous Delivery (CD)**.

The application will first be automatically deployed to a **staging environment**. After deployment, automated tests will verify that the staging application is working correctly. A tested version can then be manually promoted to the **production environment**.

The same Docker images that are tested in staging are deployed to production. The application is **not rebuilt** during production deployment.

---

## 1. Continuous Delivery Workflow

The Week 08 pipeline consists of four GitHub Actions workflows:

![](./workflow.png)

The first three workflows run automatically.

Production deployment is intentionally manual.

---

# 2. Prepare the Infrastructure

Create the Terraform infrastructure files using the same approach demonstrated in **Week 06**.

The infrastructure should provide the Azure resources required by the application, including the Kubernetes infrastructure, Azure Container Registry, and Azure Storage configuration used by the application.

### Important AKS Change

When creating the Kubernetes infrastructure, update the AKS node count to:

```hcl
node_count = 3
```

Three nodes are required for this practical because both the staging and production environments run persistent PostgreSQL database workloads.

After running Terraform, verify that the AKS cluster contains three nodes:

```bash
kubectl get nodes
```

---

# 4. Fork the Repository

Fork the provided Week 08 repository into your own GitHub account.

Clone your fork:

```bash
git clone <YOUR-FORK-URL>
```

Move into the project:

```bash
cd week08
```

Ensure that your remote points to your fork:

```bash
git remote -v
```

---

# 5. Create Azure Service Principal

GitHub Actions requires permission to interact with Azure.

Create a Service Principal following the same process introduced previously.

The Service Principal must have sufficient permissions to:

* authenticate with Azure;
* push Docker images to Azure Container Registry;
* access the AKS cluster;
* deploy Kubernetes workloads.

Store the Service Principal credentials as a GitHub Repository Secret named:

```text
AZURE_CREDENTIALS
```

The value must use the following structure:

```json
{
  "clientId": "YOUR_CLIENT_ID",
  "clientSecret": "YOUR_CLIENT_SECRET",
  "subscriptionId": "YOUR_SUBSCRIPTION_ID",
  "tenantId": "YOUR_TENANT_ID"
}
```

Do not commit these credentials to the repository.

---

# 6. Configure GitHub Repository Variables

Go to:

```text
GitHub Repository
→ Settings
→ Secrets and variables
→ Actions
→ Variables
```

Create the following **Repository Variables**.

### ACR_NAME

The name of your Azure Container Registry.

---

### ACR_LOGIN_SERVER

The complete ACR login server.

---

### AKS_RESOURCE_GROUP

The Resource Group containing your AKS cluster.

---

### AKS_CLUSTER_NAME

The name of your AKS cluster.

---

# 7. Repository Secret

Under:

```text
Settings
→ Secrets and variables
→ Actions
→ Secrets
```

create:

```text
AZURE_CREDENTIALS
```

This contains the Service Principal authentication JSON.

---

# 8. Create the Staging GitHub Environment

Go to:

```text
GitHub Repository
→ Settings
→ Environments
→ New environment
```

Create:

```text
staging
```

Add the following **Environment Secrets**:

```text
POSTGRES_USER = postgres
POSTGRES_PASSWORD = postgres
JWT_SECRET_KEY = koalatech-local-development-secret
DEFAULT_ADMIN_USERNAME = admin
DEFAULT_ADMIN_EMAIL = admin@koalatech.edu.au
DEFAULT_ADMIN_PASSWORD = AdminPassword123!
AZURE_STORAGE_CONNECTION_STRING = <YOUR_STORAGE_ACCOUNT_CONNECTION_STRING>
```
---

# 9. Create the Production GitHub Environment

Create another environment:

```text
production
```

Add the same Environment Secret names:

```text
POSTGRES_USER = postgres
POSTGRES_PASSWORD = postgres
JWT_SECRET_KEY = koalatech-local-development-secret
DEFAULT_ADMIN_USERNAME = admin
DEFAULT_ADMIN_EMAIL = admin@koalatech.edu.au
DEFAULT_ADMIN_PASSWORD = AdminPassword123!
AZURE_STORAGE_CONNECTION_STRING = <YOUR_STORAGE_ACCOUNT_CONNECTION_STRING>
```

Staging and production therefore have independent environment configuration.

---

# 10. GitHub Configuration Summary

The final GitHub configuration should be:

| Type                          | Name                              |
| ----------------------------- | --------------------------------- |
| Repository Secret             | `AZURE_CREDENTIALS`               |
| Repository Variable           | `ACR_NAME`                        |
| Repository Variable           | `ACR_LOGIN_SERVER`                |
| Repository Variable           | `AKS_RESOURCE_GROUP`              |
| Repository Variable           | `AKS_CLUSTER_NAME`                |
| Staging Environment Secret    | `POSTGRES_USER`                   |
| Staging Environment Secret    | `POSTGRES_PASSWORD`               |
| Staging Environment Secret    | `JWT_SECRET_KEY`                  |
| Staging Environment Secret    | `DEFAULT_ADMIN_USERNAME`          |
| Staging Environment Secret    | `DEFAULT_ADMIN_EMAIL`             |
| Staging Environment Secret    | `DEFAULT_ADMIN_PASSWORD`          |
| Staging Environment Secret    | `AZURE_STORAGE_CONNECTION_STRING` |
| Production Environment Secret | `POSTGRES_USER`                   |
| Production Environment Secret | `POSTGRES_PASSWORD`               |
| Production Environment Secret | `JWT_SECRET_KEY`                  |
| Production Environment Secret | `DEFAULT_ADMIN_USERNAME`          |
| Production Environment Secret | `DEFAULT_ADMIN_EMAIL`             |
| Production Environment Secret | `DEFAULT_ADMIN_PASSWORD`          |
| Production Environment Secret | `AZURE_STORAGE_CONNECTION_STRING` |

---

# 11. GitHub Actions Workflows

The repository contains four workflow files:

```text
.github/
└── workflows/
    ├── 01-ci.yml
    ├── 02-deploy-staging.yml
    ├── 03-staging-test.yml
    └── 04-deploy-production.yml
```

---

# 12. Run and Verify the Staging Application

Verify that the following workflows complete successfully:

01 - CI
02 - Deploy to Staging
03 - Staging Test

Once the deployment is complete, verify the Kubernetes resources in the staging namespace and access the staging application using the frontend external IP.

Confirm that the application is working correctly before proceeding to production.

13. Deploy to Production

Production deployment is performed manually.

Go to:

GitHub Repository
→ Actions
→ 04 - Deploy to Production
→ Run workflow

Provide the image SHA that successfully passed the staging deployment and testing process.

### Find the Image SHA

Before running the production workflow, obtain the Git commit SHA of the version that was successfully deployed and tested in staging:

```bash
git rev-parse HEAD
```

Copy the returned SHA and provide it as the `image_tag` when manually running the **04 - Deploy to Production** workflow.

> Make sure the SHA belongs to the version that successfully passed the staging pipeline.


Run the production workflow and verify that it completes successfully.

Important: Production must use the same image version that was tested in staging. Do not rebuild the Docker images for production.

14. Verify the Production Application

After the production deployment completes:

- Verify the Kubernetes resources in the production namespace.
- Find the external IP of the production frontend service.
- Access the production application.
- Confirm that the application is working correctly.
- Verify that production is running the same image SHA that was tested in staging.