const navItems =
    document.querySelectorAll(".nav-item");

const sections =
    document.querySelectorAll(".section");

const quickButtons =
    document.querySelectorAll(".quick-btn");

const menuButton =
    document.getElementById("menuButton");

const sidebar =
    document.getElementById("sidebar");


/* ================= AUTH CHECK ================= */

async function checkAdmin() {

    try {

        const response =
            await fetch("/admin/status");

        const data =
            await response.json();

        if (!data.loggedIn) {

            window.location.href =
                "/admin/admin.html";

            return false;
        }

        return true;

    } catch (error) {

        console.error(error);

        window.location.href =
            "/admin/admin.html";

        return false;
    }
}


/* ================= SECTION SWITCH ================= */

function showSection(sectionName) {

    sections.forEach(section => {

        section.classList.remove(
            "active-section"
        );

    });

    navItems.forEach(item => {

        item.classList.remove("active");

    });

    const target =
        document.getElementById(sectionName);

    if (target) {

        target.classList.add(
            "active-section"
        );
    }

    navItems.forEach(item => {

        if (
            item.dataset.section ===
            sectionName
        ) {

            item.classList.add("active");

        }

    });

    sidebar.classList.remove("open");

    if (sectionName === "projects") {

        loadProjects();

    }

    if (sectionName === "donations") {

        loadDonations();

    }

    if (sectionName === "visitors") {

        loadVisitors();

    }

    if (sectionName === "gallery") {

    loadGallery();

    }

    if (sectionName === "settings") {

    loadSettings();

}

    if (sectionName === "messages") {
    loadMessages();
}

}


/* ================= NAV EVENTS ================= */

navItems.forEach(item => {

    item.addEventListener("click", () => {

        showSection(
            item.dataset.section
        );

    });

});


quickButtons.forEach(button => {

    button.addEventListener("click", () => {

        showSection(
            button.dataset.section
        );

    });

});


/* ================= MOBILE MENU ================= */

menuButton.addEventListener(
    "click",
    () => {

        sidebar.classList.toggle("open");

    }
);


/* =====================================================
   PROJECT MANAGER
===================================================== */

let adminProjects = [];

let currentProjectId = null;


/* ================= LOAD PROJECTS ================= */

async function loadProjects() {

    const container =
        document.getElementById(
            "projectsContent"
        );


    container.innerHTML = `
        <div class="loading-box">
            Loading projects...
        </div>
    `;


    try {

        const response =
            await fetch(
                "/admin/projects"
            );


        if (response.status === 401) {

            window.location.href =
                "/admin/admin.html";

            return;

        }


        const data =
            await response.json();


        if (!data.success) {

            throw new Error(
                data.message ||
                "Failed to load projects"
            );

        }


        adminProjects =
            data.projects || [];


        document.getElementById(
            "projectStat"
        ).textContent =
            adminProjects.length;


        renderProjects();


    } catch (error) {

        console.error(error);


        container.innerHTML = `
            <div class="empty-projects">
                Failed to load projects.
            </div>
        `;

    }

}


/* ================= RENDER PROJECTS ================= */

function renderProjects() {

    const container =
        document.getElementById(
            "projectsContent"
        );


    const search =
        (
            document.getElementById(
                "projectSearch"
            )?.value || ""
        )
        .trim()
        .toLowerCase();


    const filter =
        document.getElementById(
            "projectFilter"
        )?.value || "all";


    const filtered =
        adminProjects.filter(
            project => {

                const matchesSearch =
                    project.title
                        .toLowerCase()
                        .includes(search);


                const matchesLanguage =
                    filter === "all" ||
                    project.language === filter;


                return (
                    matchesSearch &&
                    matchesLanguage
                );

            }
        );


    if (!filtered.length) {

        container.innerHTML = `
            <div class="empty-projects">
                No projects found.
            </div>
        `;

        return;
    }


    container.innerHTML =
        filtered.map(
            project => {

                const language =
                    project.language === "cpp"
                        ? "C++"
                        : "C";


                const languageClass =
                    project.language === "cpp"
                        ? "language-cpp"
                        : "language-c";


                const date =
                    project.createdAt
                        ? new Date(
                            project.createdAt
                        ).toLocaleDateString(
                            "en-IN",
                            {
                                day: "2-digit",
                                month: "short",
                                year: "numeric"
                            }
                        )
                        : "Unknown";


                return `

                    <div
                        class="project-card"
                        data-id="${project._id}"
                    >

                        <div class="project-top">

                            <div class="project-name">

                                ${escapeHTML(
                                    project.title
                                )}

                            </div>

                            <span
                                class="
                                    language-badge
                                    ${languageClass}
                                "
                            >

                                ${language}

                            </span>

                        </div>


                        <div class="project-date">

                            Created:
                            ${date}

                        </div>


                        <div class="project-actions">

                            <button
                                class="project-action"
                                onclick="
                                    viewProject(
                                        '${project._id}'
                                    )
                                "
                            >
                                👁 View
                            </button>


                            <button
                                class="project-action"
                                onclick="
                                    editProject(
                                        '${project._id}'
                                    )
                                "
                            >
                                ✏ Edit
                            </button>


                            <button
                                class="project-action"
                                onclick="
                                    downloadProject(
                                        '${project._id}'
                                    )
                                "
                            >
                                ⬇ Download
                            </button>


                            <button
                                class="
                                    project-action
                                    delete
                                "
                                onclick="
                                    deleteProject(
                                        '${project._id}'
                                    )
                                "
                            >
                                🗑 Delete
                            </button>

                        </div>

                    </div>

                `;

            }
        ).join("");

}


/* ================= OPEN ADD MODAL ================= */

function openAddProjectModal() {

    currentProjectId = null;


    document.getElementById(
        "projectModalTitle"
    ).textContent =
        "Add Project";


    document.getElementById(
        "projectForm"
    ).reset();


    document.getElementById(
        "projectId"
    ).value = "";


    document.getElementById(
        "projectFormError"
    ).textContent = "";


    document.getElementById(
        "projectModal"
    ).classList.add("show");

}


/* ================= EDIT PROJECT ================= */

async function editProject(id) {

    try {

        const response =
            await fetch(
                `/admin/projects/${id}`
            );


        if (response.status === 401) {

            window.location.href =
                "/admin/admin.html";

            return;

        }


        const data =
            await response.json();


        if (!data.success) {

            alert(
                data.message ||
                "Failed to load project."
            );

            return;

        }


        const project =
            data.project;


        currentProjectId =
            project._id;


        document.getElementById(
            "projectModalTitle"
        ).textContent =
            "Edit Project";


        document.getElementById(
            "projectId"
        ).value =
            project._id;


        document.getElementById(
            "projectTitle"
        ).value =
            project.title;


        document.getElementById(
            "projectLanguage"
        ).value =
            project.language;


        document.getElementById(
            "projectCode"
        ).value =
            project.code;


        document.getElementById(
            "projectFormError"
        ).textContent = "";


        document.getElementById(
            "projectModal"
        ).classList.add("show");


    } catch (error) {

        console.error(error);

        alert(
            "Failed to load project."
        );

    }

}


/* ================= VIEW PROJECT ================= */

async function viewProject(id) {

    try {

        const response =
            await fetch(
                `/admin/projects/${id}`
            );


        const data =
            await response.json();


        if (!data.success) {

            alert(
                data.message ||
                "Failed to load project."
            );

            return;

        }


        const project =
            data.project;


        document.getElementById(
            "codeModalTitle"
        ).textContent =
            project.title;


        document.getElementById(
            "codeModalLanguage"
        ).textContent =
            project.language === "cpp"
                ? "C++"
                : "C";


        document.getElementById(
            "projectCodeView"
        ).textContent =
            project.code;


        document.getElementById(
            "downloadCodeBtn"
        ).onclick = () => {

            downloadProject(
                project._id
            );

        };


        document.getElementById(
            "copyCodeBtn"
        ).onclick = async () => {

            try {

                await navigator.clipboard
                    .writeText(
                        project.code
                    );


                const button =
                    document.getElementById(
                        "copyCodeBtn"
                    );


                button.textContent =
                    "✓ Copied";


                setTimeout(() => {

                    button.textContent =
                        "📋 Copy Code";

                }, 1500);


            } catch {

                alert(
                    "Unable to copy code."
                );

            }

        };


        document.getElementById(
            "codeModal"
        ).classList.add("show");


    } catch (error) {

        console.error(error);

        alert(
            "Failed to load project."
        );

    }

}


/* ================= DOWNLOAD ================= */

async function downloadProject(id) {

    try {

        const response =
            await fetch(
                `/admin/projects/${id}`
            );


        const data =
            await response.json();


        if (!data.success) {

            alert(
                data.message ||
                "Project not found."
            );

            return;

        }


        const project =
            data.project;


        const extension =
            project.language === "cpp"
                ? "cpp"
                : "c";


        const blob =
            new Blob(
                [project.code],
                {
                    type:
                        "text/plain"
                }
            );


        const url =
            URL.createObjectURL(
                blob
            );


        const link =
            document.createElement(
                "a"
            );


        link.href = url;


        link.download =
            `${project.title}.${extension}`;


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        URL.revokeObjectURL(
            url
        );


    } catch (error) {

        console.error(error);

        alert(
            "Download failed."
        );

    }

}


/* ================= DELETE ================= */

async function deleteProject(id) {

    const project =
        adminProjects.find(
            item =>
                item._id === id
        );


    if (!project) {

        return;

    }


    const confirmed =
        confirm(
            `Delete "${project.title}"?\n\nThis cannot be undone.`
        );


    if (!confirmed) {

        return;

    }


    try {

        const response =
            await fetch(
                `/admin/projects/${id}`,
                {
                    method:
                        "DELETE"
                }
            );


        if (response.status === 401) {

            window.location.href =
                "/admin/admin.html";

            return;

        }


        const data =
            await response.json();


        if (!data.success) {

            alert(
                data.message ||
                "Failed to delete project."
            );

            return;

        }


        await loadProjects();


        alert(
            "Project deleted successfully."
        );


    } catch (error) {

        console.error(error);

        alert(
            "Delete failed."
        );

    }

}


/* ================= SAVE PROJECT ================= */

document
    .getElementById("projectForm")
    .addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const title =
                document.getElementById(
                    "projectTitle"
                ).value.trim();


            const language =
                document.getElementById(
                    "projectLanguage"
                ).value;


            const code =
                document.getElementById(
                    "projectCode"
                ).value;


            const errorBox =
                document.getElementById(
                    "projectFormError"
                );


            errorBox.textContent = "";


            if (!title || !code) {

                errorBox.textContent =
                    "Title and code are required.";

                return;

            }


            const id =
                document.getElementById(
                    "projectId"
                ).value;


            const isEdit =
                Boolean(id);


            try {

                const response =
                    await fetch(

                        isEdit
                            ? `/admin/projects/${id}`
                            : "/admin/projects",

                        {

                            method:
                                isEdit
                                    ? "PUT"
                                    : "POST",

                            headers: {

                                "Content-Type":
                                    "application/json"

                            },

                            body:
                                JSON.stringify({

                                    title,

                                    code,

                                    language

                                })

                        }

                    );


                const data =
                    await response.json();


                if (!response.ok ||
                    !data.success) {

                    errorBox.textContent =
                        data.message ||
                        "Failed to save project.";

                    return;

                }


                closeProjectModal();


                await loadProjects();


                alert(
                    isEdit
                        ? "Project updated successfully."
                        : "Project added successfully."
                );


            } catch (error) {

                console.error(error);

                errorBox.textContent =
                    "Server error. Please try again.";

            }

        }
    );


/* ================= SEARCH ================= */

document
    .getElementById("projectSearch")
    .addEventListener(
        "input",
        renderProjects
    );


/* ================= FILTER ================= */

document
    .getElementById("projectFilter")
    .addEventListener(
        "change",
        renderProjects
    );


/* ================= ADD BUTTON ================= */

document
    .getElementById("addProjectBtn")
    .addEventListener(
        "click",
        openAddProjectModal
    );


/* ================= CLOSE MODAL ================= */

function closeProjectModal() {

    document
        .getElementById("projectModal")
        .classList.remove("show");

}


document
    .getElementById("closeProjectModal")
    .addEventListener(
        "click",
        closeProjectModal
    );


document
    .getElementById("cancelProjectBtn")
    .addEventListener(
        "click",
        closeProjectModal
    );


document
    .getElementById("closeCodeModal")
    .addEventListener(
        "click",
        () => {

            document
                .getElementById(
                    "codeModal"
                )
                .classList.remove(
                    "show"
                );

        }
    );


/* ================= CLOSE MODALS ON BACKDROP ================= */

document
    .getElementById("projectModal")
    .addEventListener(
        "click",
        event => {

            if (
                event.target.id ===
                "projectModal"
            ) {

                closeProjectModal();

            }

        }
    );


document
    .getElementById("codeModal")
    .addEventListener(
        "click",
        event => {

            if (
                event.target.id ===
                "codeModal"
            ) {

                document
                    .getElementById(
                        "codeModal"
                    )
                    .classList.remove(
                        "show"
                    );

            }

        }
    );

/* ================= GALLERY ================= */

async function loadGallery() {
    const container =
        document.getElementById(
            "galleryContent"
        );

    try {
        const response =
            await fetch(
                "/admin/api/gallery"
            );

        if (response.status === 401) {
            window.location.href =
                "/admin/admin.html";
            return;
        }

        const data =
            await response.json();

        const galleryStat =
            document.getElementById(
                "galleryStat"
            );

        if (galleryStat) {
            galleryStat.textContent =
                data.images
                    ? data.images.length
                    : 0;
        }

        if (!data.success) {
            container.innerHTML = `
                <p class="coming">
                    ${escapeHTML(
                        data.message ||
                        "Failed to load gallery."
                    )}
                </p>
            `;
            return;
        }

        if (!data.images.length) {
            container.innerHTML = `
                <p class="coming">
                    No gallery images yet.
                </p>
            `;
            return;
        }

        container.innerHTML = `
            <h3 style="
                color:#00f7ff;
                margin-bottom:20px;
            ">
                Gallery Images
                (${data.images.length})
            </h3>

            <div style="
                display:grid;
                grid-template-columns:
                    repeat(
                        auto-fit,
                        minmax(260px, 1fr)
                    );
                gap:20px;
            ">
                ${data.images.map(image => `
                    <div style="
                        background:#0f172a;
                        border:1px solid
                            rgba(0,247,255,.15);
                        border-radius:12px;
                        overflow:hidden;
                    ">
                        <img
                            src="${escapeHTML(
                                image.imageUrl
                            )}"
                            alt="${escapeHTML(
                                image.title
                            )}"
                            style="
                                width:100%;
                                height:200px;
                                object-fit:cover;
                                display:block;
                                cursor:pointer;
                            "
                            onclick="
                                viewGalleryImage(
                                    '${image._id}'
                                )
                            "
                        >

                        <div style="padding:15px;">
                            <strong>
                                ${escapeHTML(
                                    image.title
                                )}
                            </strong>

                            <p style="
                                color:#cbd5e1;
                                font-size:13px;
                                line-height:1.5;
                                margin:8px 0;
                            ">
                                ${escapeHTML(
                                    image.description ||
                                    "No description"
                                )}
                            </p>

                            <p style="
                                color:#94a3b8;
                                font-size:12px;
                                margin:8px 0;
                            ">
                                ${
                                    image.visible
                                    ? "🟢 Visible"
                                    : "🔴 Hidden"
                                }
                            </p>

                            <div style="
                                display:flex;
                                gap:8px;
                                flex-wrap:wrap;
                                margin-top:12px;
                            ">
                                <button
                                    class="project-action"
                                    onclick="
                                        viewGalleryImage(
                                            '${image._id}'
                                        )
                                    "
                                >
                                    👁 View
                                </button>

                                <button
                                    class="project-action"
                                    onclick="
                                        editGalleryImage(
                                            '${image._id}'
                                        )
                                    "
                                >
                                    ✏ Edit
                                </button>

                                <button
                                    class="project-action"
                                    onclick="
                                        downloadGalleryImage(
                                            '${image._id}'
                                        )
                                    "
                                >
                                    ⬇ Download
                                </button>

                                <button
                                    class="
                                        project-action
                                        delete
                                    "
                                    onclick="
                                        deleteGalleryImage(
                                            '${image._id}'
                                        )
                                    "
                                >
                                    🗑 Delete
                                </button>
                            </div>
                        </div>
                    </div>
                `).join("")}
            </div>
        `;

    } catch (error) {
        console.error(
            "Gallery error:",
            error
        );

        container.innerHTML = `
            <p class="coming">
                Failed to load gallery.
            </p>
        `;
    }
}


/* ================= EDIT GALLERY ================= */

async function editGalleryImage(id) {
    try {
        const response =
            await fetch(
                `/admin/api/gallery/${id}`
            );

        if (response.status === 401) {
            window.location.href =
                "/admin/admin.html";
            return;
        }

        const data =
            await response.json();

        if (!data.success) {
            alert(
                data.message ||
                "Failed to load gallery image."
            );
            return;
        }

        const image =
            data.image;

        const title =
            prompt(
                "Edit image title:",
                image.title || ""
            );

        if (title === null) {
            return;
        }

        const description =
            prompt(
                "Edit image description:",
                image.description || ""
            );

        if (description === null) {
            return;
        }

        if (!title.trim()) {
            alert(
                "Image title cannot be empty."
            );
            return;
        }

        const updateResponse =
            await fetch(
                `/admin/api/gallery/${id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify({
                        title:
                            title.trim(),
                        description:
                            description.trim()
                    })
                }
            );

        const result =
            await updateResponse.json();

        if (!updateResponse.ok ||
            !result.success) {
            alert(
                result.message ||
                "Failed to update image."
            );
            return;
        }

        await loadGallery();

        alert(
            "Image details updated successfully."
        );

    } catch (error) {
        console.error(
            "Gallery edit error:",
            error
        );

        alert(
            "Failed to edit image."
        );
    }
}


/* ================= VIEW GALLERY ================= */

async function viewGalleryImage(id) {
    try {
        const response =
            await fetch(
                `/admin/api/gallery/${id}`
            );

        const data =
            await response.json();

        if (!data.success) {
            alert(
                data.message ||
                "Image not found."
            );
            return;
        }

        window.open(
            data.image.imageUrl,
            "_blank"
        );

    } catch (error) {
        console.error(error);
        alert(
            "Unable to open image."
        );
    }
}


/* ================= DOWNLOAD GALLERY ================= */

async function downloadGalleryImage(id) {
    try {
        const response =
            await fetch(
                `/admin/api/gallery/${id}/download`
            );

        if (!response.ok) {
            alert("Download failed.");
            return;
        }

        const blob =
            await response.blob();

        const url =
            URL.createObjectURL(blob);

        const link =
            document.createElement("a");

        link.href = url;
        link.download =
            "gallery-image";

        document.body.appendChild(link);

        link.click();

        link.remove();

        URL.revokeObjectURL(url);

    } catch (error) {
        console.error(error);
        alert(
            "Download failed."
        );
    }
}


/* ================= DELETE GALLERY ================= */

async function deleteGalleryImage(id) {
    const confirmed =
        confirm(
            "Delete this image?\n\n" +
            "This will remove it from " +
            "both MongoDB and Cloudinary."
        );

    if (!confirmed) {
        return;
    }

    try {
        const response =
            await fetch(
                `/admin/api/gallery/${id}`,
                {
                    method: "DELETE"
                }
            );

        if (response.status === 401) {
            window.location.href =
                "/admin/admin.html";
            return;
        }

        const data =
            await response.json();

        if (!data.success) {
            alert(
                data.message ||
                "Failed to delete image."
            );
            return;
        }

        await loadGallery();

        alert(
            "Image deleted successfully."
        );

    } catch (error) {
        console.error(
            "Gallery delete error:",
            error
        );

        alert(
            "Delete failed."
        );
    }
}


/* ================= GALLERY UPLOAD ================= */

const galleryUploadForm =
    document.getElementById(
        "galleryUploadForm"
    );


if (galleryUploadForm) {

    galleryUploadForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const message =
                document.getElementById(
                    "galleryMessage"
                );


            const title =
                document.getElementById(
                    "galleryTitle"
                ).value.trim();

            const description =
                 document.getElementById(
                         "galleryDescription"
                ).value.trim();                


            const image =
                document.getElementById(
                    "galleryImage"
                ).files[0];


            if (!title) {

                message.textContent =
                    "Please enter an image title.";

                return;

            }


            if (!image) {

                message.textContent =
                    "Please select an image.";

                return;

            }


            message.textContent =
                "Uploading image...";


            const formData =
                new FormData();


            formData.append(
                "title",
                title
            );

            formData.append(
                "description",
                 description
            );

            formData.append(
                "image",
                image
            );


            try {

                const response =
                    await fetch(
                        "/admin/api/gallery",
                        {
                            method: "POST",
                            body: formData
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok ||
                    !data.success) {

                    message.textContent =
                        data.message ||
                        "Upload failed.";

                    return;

                }


                message.textContent =
                    "✅ Image uploaded successfully!";


                galleryUploadForm.reset();


                await loadGallery();


            } catch (error) {

                console.error(
                    "Gallery upload error:",
                    error
                );


                message.textContent =
                    "❌ Unable to upload image.";

            }

        }
    );

}


/* ================= DONATIONS ================= */

async function loadDonations() {

    const container =
        document.getElementById("donationsContent");

    try {

        const response =
            await fetch("/admin/api/donations");

        const data =
            await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message || "Failed to load donations"
            );
        }

        const donations = data.donations || [];

        const totalAmount = donations.reduce(
            (total, donation) =>
                total + Number(donation.amount || 0),
            0
        );

        document.getElementById(
            "donationStat"
        ).textContent =
            totalAmount.toLocaleString("en-IN");


        if (!donations.length) {

            container.innerHTML = `
                <p class="coming">
                    No donations yet.
                </p>
            `;

            return;
        }


        container.innerHTML = `

            <div style="
                display:flex;
                justify-content:space-between;
                align-items:center;
                margin-bottom:25px;
            ">

                <div>

                    <h3 style="
                        font-size:28px;
                        color:#00f7ff;
                        margin:0;
                    ">
                        ₹${totalAmount.toLocaleString("en-IN")}
                    </h3>

                    <p style="
                        color:#94a3b8;
                        margin-top:5px;
                    ">
                        ${donations.length} total donors
                    </p>

                </div>

            </div>


            ${donations.map(donation => `

                <div style="
                    display:flex;
                    justify-content:space-between;
                    align-items:center;
                    gap:20px;
                    padding:18px 0;
                    border-bottom:1px solid
                    rgba(255,255,255,.08);
                ">

                    <div>

                        <strong style="
                            font-size:16px;
                        ">
                            ${escapeHTML(
                                donation.name || "Anonymous"
                            )}
                        </strong>

                        <div style="
                            color:#64748b;
                            font-size:12px;
                            margin-top:5px;
                        ">
                            ${escapeHTML(
                                donation.email || ""
                            )}
                        </div>

                        <div style="
                            color:#64748b;
                            font-size:11px;
                            margin-top:5px;
                        ">
                            ${donation.date
                                ? new Date(
                                    donation.date
                                ).toLocaleString("en-IN")
                                : ""
                            }
                        </div>

                    </div>


                    <div style="
                        display:flex;
                        align-items:center;
                        gap:20px;
                    ">

                        <strong style="
                            color:#00f7ff;
                            font-size:18px;
                            white-space:nowrap;
                        ">
                            ₹${Number(
                                donation.amount || 0
                            ).toLocaleString("en-IN")}
                        </strong>

                        <button
                            class="project-action"
                            onclick="editDonation(
                            '${donation._id}',
                            '${escapeHTML(donation.name || "")}',
                           '${escapeHTML(donation.email || "")}',
                            '${donation.amount || 0}'
                           )"
                        >
                            ✏️ Edit
                        </button>
                        
                        <button
                            class="project-action"
                            onclick="deleteDonation('${donation._id}')"
                            style="
                                color:#ff6b6b;
                            "
                        >
                            🗑 Delete
                        </button>

                    </div>

                </div>

            `).join("")}

        `;

    } catch (error) {

        console.error(
            "Donation loading error:",
            error
        );

        container.innerHTML = `
            <p class="coming">
                ❌ Failed to load donations.
            </p>
        `;
    }
}



async function deleteDonation(id) {

    const confirmed = confirm(
        "Are you sure you want to delete this donation?"
    );

    if (!confirmed) {
        return;
    }

    try {

        const response =
            await fetch(
                `/admin/api/donations/${id}`,
                {
                    method: "DELETE"
                }
            );

        const data =
            await response.json();

        if (!response.ok || !data.success) {

            alert(
                data.message ||
                "Failed to delete donation."
            );

            return;
        }

        alert("Donation deleted successfully.");

        await loadDonations();

    } catch (error) {

        console.error(
            "Delete donation error:",
            error
        );

        alert(
            "Unable to delete donation."
        );
    }
}


async function editDonation(
    id,
    currentName,
    currentEmail,
    currentAmount
) {

    const name = prompt(
        "Donor name:",
        currentName
    );

    if (name === null) {
        return;
    }

    const email = prompt(
        "Donor email:",
        currentEmail
    );

    if (email === null) {
        return;
    }

    const amount = prompt(
        "Donation amount:",
        currentAmount
    );

    if (amount === null) {
        return;
    }

    if (!name.trim()) {
        alert("Name cannot be empty.");
        return;
    }

    if (!email.trim()) {
        alert("Email cannot be empty.");
        return;
    }

    if (
        !amount ||
        Number(amount) <= 0
    ) {
        alert("Enter a valid amount.");
        return;
    }

    try {

        const response = await fetch(
            `/admin/api/donations/${id}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type":
                        "application/json"
                },
                body: JSON.stringify({
                    name: name.trim(),
                    email: email.trim(),
                    amount: Number(amount)
                })
            }
        );

        const data =
            await response.json();

        if (!response.ok || !data.success) {

            alert(
                data.message ||
                "Failed to update donation."
            );

            return;
        }

        alert(
            "Donation updated successfully."
        );

        await loadDonations();

    } catch (error) {

        console.error(
            "Edit donation error:",
            error
        );

        alert(
            "Unable to update donation."
        );
    }
}

document.getElementById("addDonationBtn")
    ?.addEventListener("click", () => {

        const name = prompt(
            "Donor name:"
        );

        if (name === null) {
            return;
        }

        const email = prompt(
            "Donor email:"
        );

        if (email === null) {
            return;
        }

        const amount = prompt(
            "Donation amount:"
        );

        if (amount === null) {
            return;
        }

        addDonation(
            name,
            email,
            amount
        );

    });


    async function addDonation(
    name,
    email,
    amount
) {

    name = name.trim();
    email = email.trim();
    amount = Number(amount);

    if (!name) {
        alert("Name cannot be empty.");
        return;
    }

    if (!email) {
        alert("Email cannot be empty.");
        return;
    }

    if (
        !amount ||
        amount <= 0
    ) {
        alert(
            "Enter a valid donation amount."
        );
        return;
    }

    try {

        const response =
            await fetch(
                "/admin/api/donations",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        name,
                        email,
                        amount
                    })
                }
            );

        const data =
            await response.json();

        if (
            !response.ok ||
            !data.success
        ) {

            alert(
                data.message ||
                "Failed to add donation."
            );

            return;
        }

        alert(
            "Donation added successfully."
        );

        await loadDonations();

    } catch (error) {

        console.error(
            "Add donation error:",
            error
        );

        alert(
            "Unable to add donation."
        );
    }
}

/* ================= MESSAGES ================= */

async function loadMessages() {

    const container =
        document.getElementById("messagesContent");

    if (!container) {
        return;
    }

    container.innerHTML = `
        <div class="loading-box">
            Loading messages...
        </div>
    `;

    try {

        const response =
            await fetch("/admin/api/messages");

        if (response.status === 401) {
            window.location.href =
                "/admin/admin.html";
            return;
        }

        const data =
            await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message ||
                "Failed to load messages."
            );
        }

        const messages =
            data.messages || [];

            const searchInput =
    document.getElementById("messageSearch");

const searchTerm =
    searchInput
        ? searchInput.value
            .toLowerCase()
            .trim()
        : "";

const filteredMessages =
    messages.filter(message => {

        const name =
            (message.name || "")
                .toLowerCase();

        const email =
            (message.email || "")
                .toLowerCase();

        const text =
            (message.message || "")
                .toLowerCase();

        return (
            name.includes(searchTerm) ||
            email.includes(searchTerm) ||
            text.includes(searchTerm)
        );
    });

        const unreadCount =
    messages.filter(
        message => !message.read
    ).length;

const unreadElement =
    document.getElementById(
        "unreadMessagesCount"
    );

if (unreadElement) {
    unreadElement.textContent =
        unreadCount;
}


        if (!messages.length) {

            container.innerHTML = `
                <div class="empty-projects">
                    No messages yet.
                </div>
            `;

            return;
        }

        container.innerHTML =
            filteredMessages.map(message => `

                <div
                    class="project-card"
                    style="margin-bottom:15px;"
                >

                    <div class="project-top">

                        <div class="project-name">
                            ${escapeHTML(
                                message.name ||
                                "Unknown"
                            )}
                        </div>

                        <span class="language-badge">
                            ${
                                message.read
                                    ? "Read"
                                    : "Unread"
                            }
                        </span>

                        <button
    class="message-action"
    onclick="toggleMessageRead('${message._id}')"
>
    ${message.read ? "↩ Mark Unread" : "✓ Mark Read"}
</button>


<button
    class="message-action delete"
    onclick="deleteMessage('${message._id}')"
>
    🗑️ Delete
</button>

                    </div>

                    <div
                        style="
                            color:#64748b;
                            margin:8px 0;
                            font-size:13px;
                        "
                    >
                        ${escapeHTML(
                            message.email || ""
                        )}
                    </div>

                    <div
                        style="
                            color:#cbd5e1;
                            line-height:1.6;
                            margin:12px 0;
                        "
                    >
                        ${escapeHTML(
                            message.message || ""
                        )}
                    </div>

                    <div
                        style="
                            color:#64748b;
                            font-size:11px;
                        "
                    >
                        ${
                            message.createdAt
                                ? new Date(
                                    message.createdAt
                                  ).toLocaleString(
                                    "en-IN"
                                  )
                                : ""
                        }
                    </div>

                </div>

            `).join("");

    } catch (error) {

        console.error(
            "Messages error:",
            error
        );

        container.innerHTML = `
            <div class="empty-projects">
                Failed to load messages.
            </div>
        `;
    }
}

document.addEventListener(
    "input",
    function(e) {

        if (e.target.id === "messageSearch") {
            loadMessages();
        }

    }
);

/* ================= TOGGLE MESSAGE READ ================= */

async function toggleMessageRead(id) {

    try {

        const response = await fetch(
            `/admin/api/messages/${id}/read`,
            {
                method: "PUT"
            }
        );

        const data = await response.json();

        if (!data.success) {
            alert(
                data.message ||
                "Failed to update message."
            );
            return;
        }

        loadMessages();

    } catch (error) {

        console.error(
            "Toggle message read error:",
            error
        );

        alert(
            "Failed to update message."
        );
    }
}


/* ================= DELETE MESSAGE ================= */

async function deleteMessage(id) {

    const confirmDelete = confirm(
        "Are you sure you want to delete this message?"
    );

    if (!confirmDelete) {
        return;
    }

    try {

        const response = await fetch(
            `/admin/api/messages/${id}`,
            {
                method: "DELETE"
            }
        );

        const data = await response.json();

        if (!data.success) {

            alert(
                data.message ||
                "Failed to delete message."
            );

            return;
        }

        alert("Message deleted successfully.");

        loadMessages();

    } catch (error) {

        console.error(
            "Delete message error:",
            error
        );

        alert(
            "Failed to delete message."
        );
    }
}

/* ================= VISITORS ================= */

async function loadVisitors() {

    try {

        const response =
            await fetch("/admin/visitor-stats");

        const data =
            await response.json();

        document.getElementById(
            "visitorStat"
        ).textContent =
            data.count || 0;

        document.getElementById(
            "visitorBig"
        ).textContent =
            data.count || 0;

    } catch (error) {

        console.error(
            "Visitor statistics error:",
            error
        );

    }

}


/* ================= WEBSITE SETTINGS ================= */

async function loadSettings() {

    try {

        const response =
            await fetch("/admin/api/settings");

        const data =
            await response.json();

        if (!data.success) {
            return;
        }

        const settings =
            data.settings;

        document.getElementById(
            "settingSiteTitle"
        ).value =
            settings.siteTitle || "";

        document.getElementById(
            "settingSiteDescription"
        ).value =
            settings.siteDescription || "";

        document.getElementById(
            "settingContactEmail"
        ).value =
            settings.contactEmail || "";

        document.getElementById(
            "settingInstagram"
        ).value =
            settings.instagram || "";

        document.getElementById(
            "settingGithub"
        ).value =
            settings.github || "";

        document.getElementById(
            "settingLinkedin"
        ).value =
            settings.linkedin || "";

    } catch (error) {

        console.error(
            "Settings Load Error:",
            error
        );

    }

}


/* ================= SAVE WEBSITE SETTINGS ================= */

document
    .getElementById("saveSettingsBtn")
    .addEventListener(
        "click",
        async () => {

            const settings = {

                siteTitle:
                    document.getElementById(
                        "settingSiteTitle"
                    ).value.trim(),

                siteDescription:
                    document.getElementById(
                        "settingSiteDescription"
                    ).value.trim(),

                contactEmail:
                    document.getElementById(
                        "settingContactEmail"
                    ).value.trim(),

                instagram:
                    document.getElementById(
                        "settingInstagram"
                    ).value.trim(),

                github:
                    document.getElementById(
                        "settingGithub"
                    ).value.trim(),

                linkedin:
                    document.getElementById(
                        "settingLinkedin"
                    ).value.trim()

            };


            try {

                const response =
                    await fetch(
                        "/admin/api/settings",
                        {
                            method: "PUT",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(
                                    settings
                                )
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok ||
                    !data.success) {

                    alert(
                        data.message ||
                        "Failed to save settings."
                    );

                    return;
                }


                alert(
                    "✅ Settings saved successfully!"
                );


            } catch (error) {

                console.error(
                    "Settings Save Error:",
                    error
                );

                alert(
                    "❌ Failed to save settings."
                );

            }

        }
    );



/* ================= INITIAL DATA ================= */

async function loadDashboardData() {

    await loadProjects();

    await loadDonations();

    await loadVisitors();

    await loadGallery();

}


/* ================= LOGOUT ================= */

document
    .getElementById("logout")
    .addEventListener("click", async () => {

        try {

            await fetch(
                "/admin/logout",
                {
                    method: "POST"
                }
            );

        } finally {

            window.location.href =
                "/admin/admin.html";

        }

    });


/* ================= HTML SECURITY ================= */

function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* ================= START ================= */

(async () => {

    const loggedIn =
        await checkAdmin();

    if (loggedIn) {

        await loadDashboardData();

    }

})();