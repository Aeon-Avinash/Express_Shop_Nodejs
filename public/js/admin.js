const csrfToken = document.getElementById("_csrf").value;

const deleteProduct = async btnElem => {
  const productId = btnElem.getAttribute("id");
  const res = await fetch(`/admin/product/${productId}`, {
    method: "DELETE",
    headers: {
      "csrf-token": csrfToken
    }
  });
  const resJson = await res.json();
  if (resJson.message === "success") {
    btnElem.closest("article").remove();
  } else {
    const errorMessage = btnElem.closest("article").lastElementChild;
    errorMessage.innerHTML = "<span>Delete request failed</span>";
    errorMessage.style.visibility = "visible";
  }
};
