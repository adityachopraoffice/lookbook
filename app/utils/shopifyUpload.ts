// app/utils/shopifyUpload.ts
export async function uploadFileToShopify(admin: any, file: File) {
  // 1. Request staged upload
  const stagedUploadsQuery = `
    mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
      stagedUploadsCreate(input: $input) {
        stagedTargets {
          url
          resourceUrl
          parameters {
            name
            value
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const stagedUploadsResponse = await admin.graphql(stagedUploadsQuery, {
    variables: {
      input: [
        {
          resource: "IMAGE",
          filename: file.name,
          mimeType: file.type,
          httpMethod: "POST",
        },
      ],
    },
  });

  const stagedUploadsData = await stagedUploadsResponse.json();
  const target = stagedUploadsData.data.stagedUploadsCreate.stagedTargets[0];

  if (!target) {
    throw new Error("Failed to create staged upload target");
  }

  // 2. Upload file to target URL
  const formData = new FormData();
  target.parameters.forEach((param: any) => {
    formData.append(param.name, param.value);
  });
  formData.append("file", file);

  const uploadResponse = await fetch(target.url, {
    method: "POST",
    body: formData,
  });

  if (!uploadResponse.ok) {
    throw new Error("Failed to upload file to target URL");
  }

  // 3. Create file in Shopify
  const fileCreateQuery = `
    mutation fileCreate($files: [FileCreateInput!]!) {
      fileCreate(files: $files) {
        files {
          id
          fileStatus
          ... on MediaImage {
            id
            image {
              url
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const fileCreateResponse = await admin.graphql(fileCreateQuery, {
    variables: {
      files: [
        {
          alt: "Lookbook Image",
          contentType: "IMAGE",
          originalSource: target.resourceUrl,
        },
      ],
    },
  });

  const fileCreateData = await fileCreateResponse.json();
  let createdFile = fileCreateData.data.fileCreate.files[0];

  if (createdFile && (createdFile.fileStatus === "PROCESSING" || createdFile.fileStatus === "UPLOADED" || !createdFile.image?.url)) {
    // Poll Shopify up to 10 times (10 seconds) until the image is processed and URL is available
    for (let i = 0; i < 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const checkQuery = `
        query node($id: ID!) {
          node(id: $id) {
            ... on MediaImage {
              id
              fileStatus
              image {
                url
              }
            }
          }
        }
      `;
      const checkRes = await admin.graphql(checkQuery, {
        variables: { id: createdFile.id }
      });
      const checkData = await checkRes.json();
      
      if (checkData.data?.node) {
        createdFile = checkData.data.node;
        if (createdFile.fileStatus === "READY" && createdFile.image?.url) {
          break;
        }
      }
    }
  }

  return createdFile;
}
