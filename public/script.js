document.getElementById("exploreBtn")
?.addEventListener("click", () => {

    document.getElementById("jobs")
    .scrollIntoView({
        behavior: "smooth"
    });
});

document.getElementById("applyBtn")
?.addEventListener("click", () => {

    document.getElementById("applySection")
    .scrollIntoView({
        behavior: "smooth"
    });
});

document.querySelectorAll(".jobBtn")
.forEach(button => {

    button.addEventListener("click", () => {

        window.location.href =
        button.dataset.link;
    });
});

const form =
document.getElementById(
    "applicationForm"
);

if (form) {

    form.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();

            const name =
                document.getElementById("name").value;

            const email =
                document.getElementById("email").value;

            const cv =
                document.getElementById("cv").files[0];

            const job =
                document.querySelector("h1").innerText;

            const formData =
                new FormData();

            formData.append("name", name);

            formData.append("email", email);

            formData.append("cv", cv);

            formData.append("job", job);

            try {

                const response =
                    await fetch("/apply", {

                        method: "POST",

                        body: formData
                    });

                const result =
                    await response.text();

                alert(result);

            } catch (error) {

                console.log(error);

                alert("Application failed");
            }
        }
    );
}

document.getElementById("searchBtn")
?.addEventListener("click", () => {

    const value =
    document.getElementById(
        "searchInput"
    ).value.toLowerCase();

    const applicants =
    document.querySelectorAll(
        ".applicant-card"
    );

    applicants.forEach(card => {

        const text =
        card.innerText.toLowerCase();

        if (text.includes(value)) {

            card.style.display =
            "block";

        } else {

            card.style.display =
            "none";
        }
    });
});

document.addEventListener(
    "click",
    async (event) => {

        if (
            event.target.classList.contains(
                "delete-btn"
            )
        ) {

            const id =
            event.target.dataset.id;

            try {

                await fetch(
                    `/delete/${id}`,
                    {
                        method: "DELETE"
                    }
                );

                location.reload();

            } catch (error) {

                console.log(error);
            }
        }
    }
);