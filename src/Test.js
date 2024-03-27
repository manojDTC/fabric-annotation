import React, { useEffect } from "react";

const YourComponent = () => {
  useEffect(() => {
    const handleClick = (event) => {
      // Log the id of the clicked li
      console.log(event.target.id);
    };

    // Attach event listener to all li elements
    const liElements = document.querySelectorAll("li");
    liElements.forEach((li) => {
      li.addEventListener("click", handleClick);
    });

    // Cleanup function to remove event listener
    return () => {
      liElements.forEach((li) => {
        li.removeEventListener("click", handleClick);
      });
    };
  }, []); // empty dependency array means this effect runs only once after initial render

  return (
    <ul>
      <li id="item1">Item 1</li>
      <li id="item2">Item 2</li>
      <li id="item3">Item 3</li>
      {/* Add more li elements dynamically if needed */}
    </ul>
  );
};

export default YourComponent;
