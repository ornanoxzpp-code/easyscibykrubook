document.addEventListener('DOMContentLoaded', () => {
    
    // *** CONFIG: Google Form URL และ Field ID ***
    
    // URL สำหรับส่งข้อมูล Google Form
    const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSfbqhpkecUg_ybrdvx8II20s-f_WCEu4H0BmbvJWgtBaMO5wA/formResponse'; 
    
    const FIELD_ID = {
        deskId: 'entry.1171635782',    
        seatId: 'entry.1575781351',     
    };
    // ********************************************
    
    // เลือกองค์ประกอบทั้งหมดที่ใช้ในการทำงาน
    const seats = document.querySelectorAll('.seat'); 
    const modal = document.getElementById('booking-modal');
    const closeButton = document.querySelector('.close-button');
    const bookingForm = document.getElementById('booking-form');
    
    // New: องค์ประกอบสำหรับ Modal 2 ขั้นตอน
    const transferDetails = document.getElementById('transfer-details');
    const bookingFormArea = document.getElementById('booking-form-area');
    const nextToFormButton = document.getElementById('next-to-form');
    const backToDetailsButton = document.getElementById('back-to-details');
    const currentDeskInfoStep1 = document.getElementById('current-desk-info-step1');
    const currentDeskInfoStep2 = document.getElementById('current-desk-info-step2');
    
    let selectedSeat = null; 
    window.submitted = false; 

    // ฟังก์ชันจัดการเมื่อการส่งข้อมูลสำเร็จ 
    window.handleSuccessfulSubmission = function() {
        if (selectedSeat) {
            alert(`🎉 การจองที่นั่งถูกบันทึกใน Google Sheet แล้ว!`);
            closeModal();
            alert('⚠️ การจองสำเร็จแล้ว รอคุณครูตรวจสอบข้อมูล เพื่อให้ที่นั่งเปลี่ยนเป็นสีแดงและทำการลงชื่อการจองของนักเรียนในภายหลัง');
        }
    };

    // ฟังก์ชันปิด Modal และรีเซ็ตกลับไปหน้าแรก (รายละเอียดการโอนเงิน)
    const closeModal = () => {
        modal.style.display = 'none';
        bookingForm.reset(); 
        selectedSeat = null;
        
        // รีเซ็ต Modal กลับไปหน้า Step 1
        bookingFormArea.style.display = 'none';
        transferDetails.style.display = 'block';
    };

    // 1. จัดการการคลิกที่ที่นั่ง (ฟังก์ชันหลักที่เปิด Modal)
    seats.forEach(seat => {
        seat.addEventListener('click', (e) => {
            e.stopPropagation(); 
            
            // 🚨 บล็อกการจอง: ถ้าสถานะเป็น booked จะเตือนและออกทันที
            if (seat.getAttribute('data-status') === 'booked') {
                alert('ที่นั่งนี้ถูกจองแล้ว! กรุณาเลือกที่นั่งอื่น');
                return; 
            }
            
            // ถ้าไม่ใช่ booked (คือ available) ให้ดำเนินการเปิดฟอร์ม
            try {
                selectedSeat = seat;
                const seatId = selectedSeat.getAttribute('data-seat-id'); 
                const deskId = selectedSeat.closest('.desk').getAttribute('data-desk-id'); 

                // แสดงข้อมูลใน Pop-up และเปิด Modal
                const deskInfo = `โต๊ะที่ ${deskId} ตำแหน่ง ${seatId}`;
                currentDeskInfoStep1.textContent = deskInfo;
                currentDeskInfoStep2.textContent = deskInfo;
                
                modal.style.display = 'block';

            } catch (error) {
                console.error("เกิดข้อผิดพลาดในการเปิดฟอร์ม:", error);
                alert("ไม่สามารถเปิดฟอร์มจองได้");
            }
        });
    });
    
    // New: จัดการการคลิกปุ่ม 'ไปยังแบบฟอร์มจอง' (Step 1 -> Step 2)
    nextToFormButton.addEventListener('click', () => {
        transferDetails.style.display = 'none';
        bookingFormArea.style.display = 'block';
    });
    
    // New: จัดการการคลิกปุ่ม 'กลับไปดูรายละเอียดการโอนเงิน' (Step 2 -> Step 1)
    backToDetailsButton.addEventListener('click', () => {
        bookingFormArea.style.display = 'none';
        transferDetails.style.display = 'block';
    });


    // Event Listeners สำหรับปิด Modal
    closeButton.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });

    // 2. จัดการการส่งฟอร์มจอง (ส่งข้อมูลไปยัง Google Form)
    bookingForm.addEventListener('submit', (e) => {
        e.preventDefault(); 
        
        // โค้ดส่งฟอร์มเหมือนเดิม (ใช้ Field ID ที่แก้ไขแล้วใน HTML)
        if (selectedSeat) {
            const seatId = selectedSeat.getAttribute('data-seat-id');
            const deskId = selectedSeat.closest('.desk').getAttribute('data-desk-id');
            
            // ลบ Hidden Inputs เก่า และสร้างใหม่สำหรับ DeskID และ SeatID
            document.querySelectorAll('#booking-form input[type="hidden"]').forEach(el => el.remove());

            // Input สำหรับ DeskID
            const hiddenDeskId = document.createElement('input');
            hiddenDeskId.type = 'hidden';
            hiddenDeskId.name = FIELD_ID.deskId;
            hiddenDeskId.value = deskId;
            bookingForm.appendChild(hiddenDeskId);
            
            // Input สำหรับ SeatID
            const hiddenSeatId = document.createElement('input');
            hiddenSeatId.type = 'hidden';
            hiddenSeatId.name = FIELD_ID.seatId;
            hiddenSeatId.value = seatId;
            bookingForm.appendChild(hiddenSeatId);

            // ตั้งค่า Form เพื่อส่งข้อมูลผ่าน iframe
            bookingForm.action = GOOGLE_FORM_URL;
            bookingForm.method = 'POST';
            bookingForm.target = 'hidden_iframe';
            
            window.submitted = true;
            
            setTimeout(() => {
                bookingForm.submit(); 
            }, 50);
        }
    });
});
