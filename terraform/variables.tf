variable "location" {
  description = "Azure region where the resources will be created"
  type        = string
  default     = "Australia East"
}

variable "resource_group_name" {
  description = "Name of the Azure Resource Group"
  type        = string
}

variable "acr_name" {
  description = "Globally unique name of the Azure Container Registry"
  type        = string

  validation {
    condition     = can(regex("^[a-zA-Z0-9]+$", var.acr_name))
    error_message = "The ACR name must contain only alphanumeric characters."
  }
}

variable "storage_account_name" {
  description = "Globally unique name of the Azure Storage Account"
  type        = string

  validation {
    condition = (
      length(var.storage_account_name) >= 3 &&
      length(var.storage_account_name) <= 24 &&
      can(regex("^[a-z0-9]+$", var.storage_account_name))
    )

    error_message = "The storage account name must contain 3-24 lowercase letters and numbers."
  }
}

variable "aks_cluster_name" {
  description = "Name of the Azure Kubernetes Service cluster"
  type        = string
}

variable "aks_dns_prefix" {
  description = "DNS prefix used by the AKS cluster"
  type        = string
}

variable "aks_node_count" {
  description = "Number of nodes in the default AKS node pool"
  type        = number
  # Week 08 requires three nodes: staging and production both run
  # persistent PostgreSQL database workloads on the same cluster.
  default = 3

  validation {
    condition     = var.aks_node_count >= 1
    error_message = "The AKS node count must be at least 1."
  }
}

variable "aks_node_vm_size" {
  description = "Virtual machine size used by the AKS nodes"
  type        = string
  default     = "Standard_D2s_v3"
}

variable "kubernetes_version" {
  description = "AKS Kubernetes version. Leave null to use the region default."
  type        = string
  default     = null
}

variable "environment" {
  description = "Environment name applied to resource tags"
  type        = string
  default     = "development"
}

variable "tags" {
  description = "Tags applied to Azure resources"
  type        = map(string)

  default = {
    Project   = "KoalaTech Course Platform"
    ManagedBy = "Terraform"
    Practical = "Week08"
  }
}
